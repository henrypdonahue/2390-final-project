const assert = require('assert');
const { JIFFClient } = require('jiff-mpc');
const readline = require('readline');
const sodium = require('libsodium-wrappers');
const config = require('./config');
const mpcSum = require('./computation/sum');
const mpcAverage = require('./computation/average');

const serverHost = config.server.host;
const serverPort = config.server.port;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function generateKeyPair() {
  await sodium.ready;
  return sodium.crypto_box_keypair();
}

// decrypts the analyst's share
function decrypt(obj, privateKey) {
  const senderPublicKey = new Uint8Array(JSON.parse(obj.senderPublicKey));
  const cipherText = new Uint8Array(JSON.parse(obj.cipherText));
  const nonce = new Uint8Array(JSON.parse(obj.nonce));
  const plainText = sodium.crypto_box_open_easy(
    cipherText,
    nonce,
    senderPublicKey,
    privateKey,
  );
  return parseInt(String.fromCharCode.apply(null, plainText));
}

async function main() {
  // Connect to the server.
  const jiffClient = new JIFFClient(
    'http://' + serverHost + ':' + serverPort,
    'test',
    {
      crypto_provider: true,
      party_id: 1,
      party_count: 2,
    },
  );
  // generate key pair
  const { publicKey, privateKey } = await generateKeyPair();
  // generate shares of 0
  const zeroShares = jiffClient.hooks.computeShares(
    jiffClient,
    0,
    [1, 's1'],
    2,
    jiffClient.Zp,
  );
  const zeroServerShare = zeroShares['s1'];
  // create jiff secret share object for analyst zero share
  const zeroAnalystShare = new jiffClient.SecretShare(
    zeroShares['1'],
    [1, 's1'],
    2,
    jiffClient.Zp,
  );
  jiffClient.wait_for([1, 's1'], async function () {
    // send public key to server
    jiffClient.emit('public-key', ['s1'], '[' + publicKey.toString() + ']');
    // send zero share to server
    jiffClient.emit('zero-share', ['s1'], zeroServerShare.toString());

    console.log('computation initialized, press enter to start...');
    process.stdout.write('> ');
    rl.on('line', function (_) {
      // send begin signal to server
      jiffClient.emit('begin', ['s1'], '');
      // Receive the analyst shares from server.
      jiffClient.listen('shares', async function (sender_id, message) {
        // ensure message comes from analyst
        assert(sender_id === 's1');
        // Parse shares from JSON.
        const dataEncrypted = JSON.parse(message);
        // decrypt each share, and turn into JIFF secret share objects
        const shares = dataEncrypted.shares.map((obj) => {
          return {
            token: new jiffClient.SecretShare(
              decrypt(obj['token'], privateKey),
              [1, 's1'],
              2,
              jiffClient.Zp,
            ),
            input: new jiffClient.SecretShare(
              decrypt(obj['input'], privateKey),
              [1, 's1'],
              2,
              jiffClient.Zp,
            ),
          };
        });
        const deleteReqShares = dataEncrypted.deleteShares.map(
          (token) =>
            new jiffClient.SecretShare(
              decrypt(token, privateKey),
              [1, 's1'],
              2,
              jiffClient.Zp,
            ),
        );
        // start computation
        const sum = mpcSum(shares, deleteReqShares, zeroAnalystShare);
        // open result
        const output = await jiffClient.open(sum[0], [1, 's1']);
        console.log('MPC result is', output / sum[1]);

        // shutdown
        jiffClient.disconnect(true, true);
        rl.close();
      });
    });
  });
}

main();