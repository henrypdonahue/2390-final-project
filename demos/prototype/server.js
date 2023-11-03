// Dependencies
var http = require('http');
var JIFFServer = require('../../lib/jiff-server.js');

// Create express and http servers
var express = require('express');
var app = express();
http = http.Server(app);
http.listen(8765, function () {
  console.log('listening on 8765');
});

// Create JIFF server
var jiffServer = new JIFFServer(http, {
  logs: false,
  socketOptions: {
    pingTimeout: 1000,
    pingInterval: 2000
  }
});
// upper bound on how input parties can submit
jiffServer.computationMaps.maxCount['prototype'] = 100000;

// Specify the computation server code for this demo
var computationClient = jiffServer.compute('prototype', {
  crypto_provider: true
});

// wait for analyst to connect
computationClient.wait_for([1], function () {
  // wait for begin signal from analyst
  computationClient.listen('begin', function () {
    var share0 = computationClient.share(null, 2, [1, 's1'], [2])[2];
    var share1 = computationClient.share(null, 2, [1, 's1'], [3])[3];
    var sum = share1.sadd(share0);
    // open result only to analyst
    computationClient.open(sum, [1]);
  });
});
