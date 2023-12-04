const sodium = require('libsodium-wrappers-sumo');
const { JIFFClient } = require('jiff-mpc');
const axios = require('axios');
const config = require('./config');

const serverHost = config.server.host;
const serverPort = config.server.port;

// sends submit request to server
async function submitData(tokenShares, inputShares) {
  const url = 'http://' + serverHost + ':' + serverPort + '/submit';
  const requestBody = {
    analystShare: {
      token: tokenShares[1],
      input: inputShares[1],
    },
    serverShare: {
      token: tokenShares['s1'],
      input: inputShares['s1'],
    },
  };
  axios.post(url, requestBody);
}

// sends delete request to server
async function deleteData(tokenShares) {
  const url = 'http://' + serverHost + ':' + serverPort + '/delete';
  const req = {
    data: {
      analystShare: tokenShares[1],
      serverShare: tokenShares['s1'],
    },
  };
  axios.delete(url, req);
}

// request for analyst's public key
async function getPublicKey() {
  const url = 'http://' + serverHost + ':' + serverPort + '/public-key';
  const response = await axios.get(url);
  return new Uint8Array(JSON.parse(response.data.message));
}

function encrypt(plainText, recipientPublicKey) {
  const senderKeyPair = sodium.crypto_box_keypair();
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  return {
    senderPublicKey: '[' + senderKeyPair.publicKey.toString() + ']',
    cipherText:
      '[' +
      sodium.crypto_box_easy(
        plainText.toString(),
        nonce,
        recipientPublicKey,
        senderKeyPair.privateKey,
      ) +
      ']',
    nonce: '[' + nonce.toString() + ']',
  };
}

function stringToInt(input) {
  let hash = 0;
  if (input.length === 0) {
    return hash;
  }
  for (let i = 0; i < input.length; i++) {
    let ch = input.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Read command line arguments
async function main() {
  const command = process.argv[2];

  await sodium.ready;

  let publicKey;
  try {
    publicKey = await getPublicKey();
  } catch (error) {
    console.error(
      'cannot retrieve analyst public key, try again until analyst connected:',
      error.code,
    );
    return;
  }
  // create fake jiffclient for computing shares
  const jiffClient = new JIFFClient('fakeurl', 'fakecomputation', {
    autoConnect: false,
  });

  if (command === 'input') {
    // Share the input with server
    const token = process.argv[3];
    const tokenInt = stringToInt(process.argv[3], 10);
    const input = parseInt(process.argv[4], 10);

    // send shares along with random token to server via some http request.
    let tokenShares = jiffClient.hooks.computeShares(
      jiffClient,
      tokenInt,
      [1, 's1'],
      2,
      jiffClient.Zp,
    );
    let inputShares = jiffClient.hooks.computeShares(
      jiffClient,
      input,
      [1, 's1'],
      2,
      jiffClient.Zp,
    );
    // encrypt the share for analyst
    tokenShares[1] = encrypt(tokenShares[1], publicKey);
    inputShares[1] = encrypt(inputShares[1], publicKey);
    // send submit data request
    try {
      await submitData(tokenShares, inputShares);
      console.log('submission success:');
      console.log('user token:', token);
      console.log('data:', input);
    } catch (error) {
      console.error('submission failed:', error);
    }
  } else if (command === 'delete') {
    // send deletion request to server
    const token = process.argv[3];
    const tokenInt = stringToInt(token, 10);
    let tokenShares = jiffClient.hooks.computeShares(
      jiffClient,
      tokenInt,
      [1, 's1'],
      2,
      jiffClient.Zp,
    );
    tokenShares[1] = encrypt(tokenShares[1], publicKey);
    try {
      await deleteData(tokenShares);
      console.log('deletion request recorded:');
      console.log('user token:', token);
    } catch (error) {
      console.error('deletion request failed:', error);
    }
  }
}

main();