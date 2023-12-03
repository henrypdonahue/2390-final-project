// Dependencies
let http = require("http");
const { JIFFServer } = require("jiff-mpc");
const express = require("express");
const fs = require("fs");
const axios = require("axios");

const config = JSON.parse(fs.readFileSync("config.json"));
const port = config.server.port;
const analystHost = config.analyst.host;
const analystPort = config.analyst.port;

const app = express();

// data of all input parties
let DB = [];
// data of tokens of users who sent deletion request
let DeletionReq = [];

// Middleware to parse JSON request bodies
app.use(express.json());

// endpoint for submitting data
app.post("/submit", (req, res) => {
  DB.push(req.body);
  res.status(200).json({ message: "data submitted successfully" });
});

// endpoint for deleting data based on a token
app.delete("/delete", (req, res) => {
  const token = req.body.token;
  DeletionReq.push(token);
  res.status(200).json({ message: "deletion request recorded" });
});

http = http.Server(app);

// request for server's share of zero
async function getZeroShare() {
  const url = "http://" + analystHost + ":" + analystPort + "/zero-share";
  const response = await axios
    .get(url)
    .catch((error) => {
      console.error("failed to get public key:", error.code, "try again until analyst online");
      throw error;
    });
  return parseInt(JSON.parse(response.data.message), 10);
}

async function main() {
  // Start the server
  const server = http.listen(port, function () {
    console.log("listening on *:", port);
  });

  // Create JIFF server
  const jiffServer = new JIFFServer(http, { logs: false });
  jiffServer.computationMaps.maxCount["test"] = 2;

  // Specify the computation server code for this demo
  let jiffClient = jiffServer.compute("test", { crypto_provider: true });
  jiffClient.wait_for([1, "s1"], async function () {
    console.log("analyst connected!");
    jiffClient.listen("begin", async function () {
      // obtain server share of 0 from analyst
      // create jiff secret share object
      let zeroShare = new jiffClient.SecretShare(
        await getZeroShare(),
        [1, "s1"],
        2,
        jiffClient.Zp,
      );
      // Send all the shares of the analyst to the analyst (they should be encrypted)
      // Keep the shares of the server here.
      let analystShares = [];
      let serverShares = [];
      for (let i = 0; i < DB.length; i++) {
        const token = DB[i]["token"];
        const input = DB[i]["input"];
        analystShares.push({
          token: token["analystShare"],
          input: input["analystShare"],
        });
        serverShares.push({
          token: token["serverShare"],
          input: input["serverShare"],
        });
      }

      // send the analyst shares to the analyst (party with id = 1).
      jiffClient.emit("shares", [1], JSON.stringify(analystShares));
      // send the analyst tokens of users who sent deletion requests


      // turn the server shares to JIFF secret share objects.
      let shares = serverShares.map((obj) => {
        return {
          token: new jiffClient.SecretShare(
            obj["token"],
            [1, "s1"],
            2,
            jiffClient.Zp
          ),
          input: new jiffClient.SecretShare(
            obj["input"],
            [1, "s1"],
            2,
            jiffClient.Zp
          ),
        };
      });

      // calculate sum
      let output = 0;
      console.log(shares);
      if (shares.length > 0) {
        let sum = zeroShare;
        for (let i = 0; i < shares.length; i++) {
          sum = sum.sadd(shares[i]["input"]);
        }
        // reveal results
        output = await jiffClient.open(sum, [1, "s1"]);
      }
      console.log("Result is", output);
      jiffClient.disconnect(true, true);
      server.close();
    });
  });
}

main();
