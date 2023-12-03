// Dependencies
let http = require('http');
const { JIFFServer } = require('jiff-mpc');
const express = require('express');
const config = require('./config');
const mpcSum = require('./computation/sum');
const { assert } = require('console');

const port = config.server.port;

const app = express();

// data of all input parties
let DB = {
  analystShares: [],
  serverShares: [],
};
// data of tokens of users who sent deletion request
let DeletionReq = {
  analystShares: [],
  serverShares: [],
};
// public key of analyst
let publicKey = null;
// server share of value 0
let zeroShare = null;

// Middleware to parse JSON request bodies
app.use(express.json());

// endpoint for submitting data
app.post('/submit', (req, res) => {
  const data = req.body;
  DB['analystShares'].push(data['analystShare']);
  DB['serverShares'].push(data['serverShare']);
  res.status(200).json({ message: 'data submitted successfully' });
});

// endpoint for deleting data based on a token
app.delete('/delete', (req, res) => {
  const data = req.body;
  DeletionReq['analystShares'].push(data['analystShare']);
  DeletionReq['serverShares'].push(data['serverShare']);
  res.status(200).json({ message: 'deletion request recorded' });
});

// endpoint for obtaining analyst public key
app.get('/public-key', (_req, res) => {
  if (publicKey === null) {
    res.status(404).json({ error: 'Public key unavilable' });
  } else {
    res.status(200).json({ message: '[' + publicKey.toString() + ']' });
  }
});

http = http.Server(app);

async function main() {
  // Start the server
  const server = http.listen(port, function () {
    console.log('SERVER listening on *:', port);
  });

  // Create JIFF server
  const jiffServer = new JIFFServer(http, { logs: false });
  jiffServer.computationMaps.maxCount['test'] = 2;

  // Specify the computation server code for this demo
  let jiffClient = jiffServer.compute('test', { crypto_provider: true });
  jiffClient.wait_for([1, 's1'], async function () {
    console.log('analyst connected!');
    // receive public key from analyst
    jiffClient.listen('public-key', async function (sender_id, message) {
      // ensure public key comes from analyst
      assert(sender_id === 1);
      // store public key
      publicKey = new Uint8Array(JSON.parse(message));
      // receive zero share from analyst
      jiffClient.listen('zero-share', async function (sender_id, message) {
        // ensure zero share comes from analyst
        assert(sender_id === 1);
        // store zero share, and create jiff secret share object
        zeroShare = new jiffClient.SecretShare(
          parseInt(JSON.parse(message)),
          [1, 's1'],
          2,
          jiffClient.Zp,
        );
        jiffClient.listen('begin', async function () {
          const serverShares = DB['serverShares'];
          const serverDeleteShares = DeletionReq['serverShares'];
          const analystData = {
            shares: DB['analystShares'],
            deleteShares: DeletionReq['analystShares'],
          };

          // send the analyst shares to the analyst (party with id = 1).
          jiffClient.emit('shares', [1], JSON.stringify(analystData));

          // ===== computation below =====
          // turn the server shares to JIFF secret share objects.
          const shares = serverShares.map((obj) => {
            return {
              token: new jiffClient.SecretShare(
                obj['token'],
                [1, 's1'],
                2,
                jiffClient.Zp,
              ),
              input: new jiffClient.SecretShare(
                obj['input'],
                [1, 's1'],
                2,
                jiffClient.Zp,
              ),
            };
          });
          const deleteReqShares = serverDeleteShares.map(
            (token) =>
              new jiffClient.SecretShare(token, [1, 's1'], 2, jiffClient.Zp),
          );
          // start computation
          const sum = mpcSum(shares, deleteReqShares, zeroShare);
          // open result
          const output = await jiffClient.open(sum, [1, 's1']);
          console.log('Result is', output);
          jiffClient.disconnect(true, true);
          server.close();
        });
      });
    });
  });
}

main();
