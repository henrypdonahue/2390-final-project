// Dependencies
let http = require('http');
const { JIFFServer } = require('jiff-mpc');

// Create express and http servers
const express = require('express');
let app = express();
http = http.Server(app);

// Create JIFF server
const jiffServer = new JIFFServer(http, { logs: false });
jiffServer.computationMaps.maxCount['test'] = 2;

// You need to define some rest APIs here for input parties to send
// shares and tokens, and request deletion based on a token, etc.
// Lets say these API fill up the object DB with the submitted shares.
const DB = {
  // Two hypothetical submissions from input parties.
  // Each are keyed by the random token the input party generates, so that
  // it is easier to find / delete the shares of that party given the token.
  // Note: the analyst share should be encrypted, this is just a demonstration.
  // Submission for party A: these two secret shares reconstruct to 10.
  "wnbROE838fxBgtGE59LfuNQ=": { analyst: 15789588, server: 988161 },
  // Submission for party B: these two secret shares reconstruct to 20.
  "JsOzGXTQA4hJ1QelE2g5WDc=": { analyst: 9064049, server: 7713720 }
};

// Specify the computation server code for this demo
var computationClient = jiffServer.compute('test', { crypto_provider: true });
computationClient.wait_for([1, 's1'], async function () {
  // Perform server-side computation.
  console.log('Computation initialized!');

  // Send all the shares of the analyst to the analyst (they should be encrypted)
  // Keep the shares of the server here.
  let analystShares = [];
  let serverShares = [];
  for (const [token, shares] of Object.entries(DB)) {
    analystShares.push(shares['analyst']);
    serverShares.push(shares['server']);
  }

  // send the analyst shares to the analyst (party with id = 1).
  computationClient.emit('shares', [1], JSON.stringify(analystShares));
  
  // turn the server shares to JIFF secret share objects.
  let shares = [];
  for (let i = 0; i < serverShares.length; i++) {
    shares.push(new computationClient.SecretShare(serverShares[i], [1, 's1'], 2, computationClient.Zp));
  }

  // Now we can do whatever computation we want. For example, we can add the two submissions together.
  let sum = shares[0];
  for (let i = 1; i < shares.length; i++) {
    sum = sum.sadd(shares[i]);
  }

  // Reveal the result.
  const output = await computationClient.open(sum, [1, 's1']);
  console.log("Result is", output);
});

http.listen(8080, function () {
  console.log('listening on *:8080');
});
