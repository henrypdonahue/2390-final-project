const sodium = require("libsodium-wrappers-sumo");
const { JIFFClient } = require("jiff-mpc");
const axios = require("axios");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("config.json"));
const serverHost = config.server.host;
const serverPort = config.server.port;

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

// Read command line arguments
async function main() {
  const command = process.argv[2];
  let input = process.argv[3];

  await sodium.ready;

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
    submitData(token, shares[1], shares["s1"]);
    console.log("to delete submission, use token: ", token);
  } else if (command === "delete") {
    deleteData(input);
  }
}

main();
