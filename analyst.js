const assert = require("assert");
const { JIFFClient } = require("jiff-mpc");
const fs = require("fs");
const readline = require("readline");
const sodium = require("libsodium-wrappers");
const express = require("express");

const config = JSON.parse(fs.readFileSync("config.json"));
const serverHost = config.server.host;
const serverPort = config.server.port;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function generateKeyPair() {
  await sodium.ready;
  return sodium.crypto_sign_keypair();
}

function startKeyServer(publicKey) {
  // start listening for public key requests
  const app = express();
  app.use(express.json());
  // endpoint for serving public key requests
  app.get("/public-key", (_req, res) => {
    if (publicKey === null) {
      res.status(404).json({ error: "Public key not found" });
    } else {
      res.status(200).json({ message: "[" + publicKey.toString() + "]" });
    }
  });
  const server = app.listen(3000, () => {
    console.log("analyst is running on port 3000");
  });
  return server;
}

async function main() {
  // generate key pair
  const { publicKey, privateKey } = await generateKeyPair();
  const server = startKeyServer(publicKey);
  // Connect to the server.
  const jiffClient = new JIFFClient(
    "http://" + serverHost + ":" + serverPort,
    "test",
    {
      crypto_provider: true,
      party_id: 1,
      party_count: 2,
    },
  );
  jiffClient.wait_for([1, "s1"], async function () {
    // send public key to server
    console.log("computation initialized, press enter to start...");
    rl.on("line", function (_) {
      // send begin signal to server
      jiffClient.emit("begin", ["s1"], "");
      // Receive the analyst shares from server.
      jiffClient.listen("shares", async function (sender_id, message) {
        assert(sender_id === "s1");

        // Parse shares from JSON.
        let analystShares = JSON.parse(message);

        // In principle, the shares should be encrypted, and you must first decrypt
        // them here using the analyst's key.
        let shares = [];
        for (let i = 0; i < analystShares.length; i++) {
          shares.push(
            new jiffClient.SecretShare(
              analystShares[i],
              [1, "s1"],
              2,
              jiffClient.Zp,
            ),
          );
        }

        // calculate sum
        let output = 0;
        if (shares.length > 0) {
          let sum = shares[0];
          for (let i = 1; i < shares.length; i++) {
            sum = sum.sadd(shares[i]);
          }
          // reveal results
          output = await jiffClient.open(sum, [1, "s1"]);
        }
        console.log("Result is", output);
        jiffClient.disconnect(true, true);
        rl.close();
        server.close();
      });
    });
  });
}

main();
