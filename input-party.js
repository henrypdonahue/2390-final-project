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
async function submitData(token, analystShare, serverShare) {
  const url = "http://" + serverHost + ":" + serverPort + "/submit";
  const requestBody = {
    token: token,
    analystShare: analystShare,
    serverShare: serverShare,
  };
  axios
    .post(url, requestBody)
    .then((response) => console.log("submit response:", response.statusText))
    .catch((error) => console.log("failed to submit data:", error.code));
}

// sends delete request to server
async function deleteData(token) {
  const url = "http://" + serverHost + ":" + serverPort + "/delete";
  const req = {
    data: {
      token: token,
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
    .catch((error) => console.log("failed to get public key:", error.code));
  return new Uint8Array(JSON.parse(response.data.message));
}

function encrypt(plainText, recipientPublicKey) {
  const senderKeyPair = sodium.crypto_box_keypair();
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  console.log(plainText.toString());
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
  let input = process.argv[3];

  await sodium.ready;

  let publicKey = await getPublicKey();
  console.log(publicKey);
  // Share the input with server
  if (command === "input") {
    input = parseInt(input, 10);

    // create fake jiffclient for computing shares
    const jiffClient = new JIFFClient("fakeurl", "fakecomputation", {
      autoConnect: false,
    });

    // send shares along with random token to server via some http request.
    const shares = jiffClient.hooks.computeShares(
      jiffClient,
      input,
      [1, "s1"],
      2,
      jiffClient.Zp,
    );
    const token = Buffer.from(sodium.randombytes_buf(32)).toString("base64");
    // encrypt the share for analyst
    const analystShare = encrypt(shares[1], publicKey);
    console.log(analystShare);
    // send submit data request
    await submitData(token, analystShare, shares["s1"]);
    console.log("to delete submission, use token: ", token);
  } else if (command === "delete") {
    await deleteData(input);
  }
}

main();
