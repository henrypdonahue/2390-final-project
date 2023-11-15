const assert = require('assert');
const { JIFFClient } = require('jiff-mpc');

// Connect to the server.
const jiffClient = new JIFFClient('http://localhost:8080', 'test', {
  crypto_provider: true,
  party_id: 1,
  party_count: 2
});
jiffClient.wait_for([1, 's1'], async function () {
  // Receive the analyst shares from server.
  jiffClient.listen('shares', async function (sender_id, message) {
    assert(sender_id === 's1');

    // Parse shares from JSON.
    let analystShares = JSON.parse(message);

    // In principle, the shares should be encrypted, and you must first decrypt
    // them here using the analyst's key.
    let shares = [];
    for (let i = 0; i < analystShares.length; i++) {
      shares.push(new jiffClient.SecretShare(analystShares[i], [1, 's1'], 2, jiffClient.Zp));
    }

    // Now we can do whatever computation we want. For example, we can add the two submissions together.
    let sum = shares[0];
    for (let i = 1; i < shares.length; i++) {
      sum = sum.sadd(shares[i]);
    }

    // Reveal the result.
    const output = await jiffClient.open(sum, [1, 's1']);
    console.log("Result is", output);
  });
});
