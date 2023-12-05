const sodium = require('libsodium-wrappers-sumo');
const { JIFFClient } = require('jiff-mpc');
// const axios = require('axios');
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
  // axios.post(url, requestBody);
  var xhttp = new XMLHttpRequest();
  xhttp.open("POST", url, true);
  xhttp.send(requestBody);
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
  // axios.delete(url, req);
  var xhttp = new XMLHttpRequest();
  xhttp.open("DELETE", url, true);
  xhttp.send(req);
}

// request for analyst's public key
async function getPublicKey(callback) {
  const url = 'http://' + serverHost + ':' + serverPort + '/public-key';
  // const response = await axios.get(url);
  var xhttp = new XMLHttpRequest();
  xhttp.open("GET", url, true);
  xhttp.onreadystatechange = async function () {
    if (xhttp.readyState === XMLHttpRequest.DONE) {
      const status = xhttp.status;
      if (status === 0 || (status >= 200 && status < 400)) {
        // The request has been completed successfully
        console.log(xhttp.responseText);
        await callback(xhttp.responseText);
      } else {
        // Oh no! There has been an error with the request!
      }
    }
  };
  xhttp.send(null);
  // return new Uint8Array(JSON.parse(response.data.message));
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
  // const command = process.argv[2];
  var command;
  if ($("#input-option").checked) {
    command = "input"
  } else if ($("#delete-option.checked")) {
    command = "delete"
  }

  await sodium.ready;

  let publicKey;

  try {
    const callback = async function (response) {
      console.log("response");
      console.log(response);
      publicKey = await response;

      publicKey = new Uint8Array(JSON.parse(publicKey));

      console.log(publicKey);
    
      // create fake jiffclient for computing shares
      const jiffClient = new JIFFClient('fakeurl', 'fakecomputation', {
        autoConnect: false,
      });
    
      if (command === 'input') {
        // Share the input with server
        // const token = process.argv[3];
        // const tokenInt = stringToInt(process.argv[3], 10);
        // const input = parseInt(process.argv[4], 10);
        console.log($("#token").value);
        console.log(("#input-value").value);
        const token = $("#token").value;
        const tokenInt = stringToInt($("#token").value, 10);
        const input = parseInt($("#input-value").value, 10);
    
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
        // const token = process.argv[3];
        const token = $("#token").value;
        const tokenInt = token;
        // const tokenInt = stringToInt(token, 10);
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
    // publicKey = await getPublicKey();

     await getPublicKey(callback);
    // publicKey = new Uint8Array(JSON.parse(publicKey));
  } catch (error) {
    console.error(
      'cannot retrieve analyst public key, try again until analyst connected:',
      error.code,
    );
    return;
  }
}


module.exports = {
  main: main
};

// main();