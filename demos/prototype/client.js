var JIFFClient = require('../../lib/jiff-client');

// read cmdline arg
var input = parseInt(process.argv[2], 10);

var options = { crypto_provider: true };
var jiffClient = new JIFFClient('http://localhost:8765', 'prototype', options);

jiffClient.wait_for(['s1', 1], function () {
  console.log('client' + jiffClient.id + ' connected!');
  jiffClient.share(input, 2, [1, 's1'], [jiffClient.id]);
  jiffClient.disconnect(true, true);
});
