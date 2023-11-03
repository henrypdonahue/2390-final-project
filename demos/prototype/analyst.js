var JIFFClient = require('../../lib/jiff-client');
var readline = require('readline');

var options = {
  party_id: 1,
  crypto_provider: true,
  socketOptions: {
    reconnectionDelay: 3000,
    reconnectionDelayMax: 4000
  }
};
var jiffClient = new JIFFClient('http://localhost:8765', 'prototype', options);

// For reading actions from the command line
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// wait for server to cnnect
jiffClient.wait_for(['s1'], function () {
  // user types enter, start computation
  rl.on('line', function () {
    // send begin signal to server
    jiffClient.emit('begin', ['s1'], '');
    // obtain share from two clients with id 2 and 3
    var share0 = jiffClient.share(null, 2, [1, 's1'], [2])[2];
    var share1 = jiffClient.share(null, 2, [1, 's1'], [3])[3];
    // calculate sum on secret share
    var sum = share1.sadd(share0);
    // open result only to analyst
    var result = jiffClient.open(sum, [1]);
    // await on future and print result
    result.then(function (sum) {
      console.log('SUM IS: ' + sum);
      jiffClient.disconnect(true, true);
      rl.close();
    }).catch(function (error) {
      console.error('Error:', error);
    });
  })
});

