const sodium = require("libsodium-wrappers-sumo");
const { JIFFClient } = require("jiff-mpc");
const axios = require("axios");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("config.json"));
const serverHost = config.server.host;
const serverPort = config.server.port;
const analystHost = config.analyst.host;
const analystPort = config.analyst.port;

// sends submit request to server
async function submitData(tokenShares, inputShares) {
  const url = "http://" + serverHost + ":" + serverPort + "/submit";
  const requestBody = {
    analystShare: {
      token: tokenShares[1],
      input: inputShares[1],
    },
    serverShare: {
      token: tokenShares["s1"],
      input: inputShares["s1"],
    },
  };
  axios
    .post(url, requestBody)
    .then((response) => console.log("submit response:", response.statusText))
    .catch((error) => console.log("failed to submit data:", error.code));
}

// sends delete request to server
async function deleteData(tokenShares) {
  const url = "http://" + serverHost + ":" + serverPort + "/delete";
  const req = {
    data: {
      analystShare: tokenShares[1],
      serverShare: tokenShares["s1"],
    },
  };
  axios
    .delete(url, req)
    .then((response) => console.log("delete response:", response.statusText))
    .catch((error) => console.log("failed to delete data:", error.code));
}

// request for analyst's public key
async function getPublicKey() {
  const url = "http://" + analystHost + ":" + analystPort + "/public-key";
  const response = await axios
    .get(url)
    .catch((error) => {
      console.error("failed to get public key:", error.code, "try again until analyst online");
      throw error;
    });
  return new Uint8Array(JSON.parse(response.data.message));
}

function encrypt(plainText, recipientPublicKey) {
  const senderKeyPair = sodium.crypto_box_keypair();
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  return {
    senderPublicKey: "[" + senderKeyPair.publicKey.toString() + "]",
    cipherText:
      "[" +
      sodium.crypto_box_easy(
        plainText.toString(),
        nonce,
        recipientPublicKey,
        senderKeyPair.privateKey,
      ) +
      "]",
    nonce: "[" + nonce.toString() + "]",
  };
}

// Read command line arguments
async function main() {
  const command = process.argv[2];

  await sodium.ready;

  let publicKey = await getPublicKey();
  // create fake jiffclient for computing shares
  const jiffClient = new JIFFClient("fakeurl", "fakecomputation", {
    autoConnect: false,
  });

  if (command === "input") {
    // Share the input with server
    let token = parseInt(process.argv[3], 10);
    let input = parseInt(process.argv[4], 10);

    // send shares along with random token to server via some http request.
    let tokenShares = jiffClient.hooks.computeShares(
      jiffClient,
      token,
      [1, "s1"],
      2,
      jiffClient.Zp,
    );
    let inputShares = jiffClient.hooks.computeShares(
      jiffClient,
      input,
      [1, "s1"],
      2,
      jiffClient.Zp,
    );
    // encrypt the share for analyst
    tokenShares[1] = encrypt(tokenShares[1], publicKey);
    inputShares[1] = encrypt(inputShares[1], publicKey);
    // send submit data request
    await submitData(tokenShares, inputShares);
    console.log("to delete submission, use token: ", token);
  } else if (command === "delete") {
    // send deletion request to server
    let token = parseInt(process.argv[3], 10);
    let tokenShares = jiffClient.hooks.computeShares(
      jiffClient,
      token,
      [1, "s1"],
      2,
      jiffClient.Zp,
    );
    tokenShares[1] = encrypt(tokenShares[1], publicKey);
    await deleteData(tokenShares);
  }
}

main();
