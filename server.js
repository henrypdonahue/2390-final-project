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

let DB = [];
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
  let computationClient = jiffServer.compute("test", { crypto_provider: true });
  computationClient.wait_for([1, "s1"], async function () {
    console.log("analyst connected!");
    computationClient.listen("begin", async function () {
      let zeroShare = await getZeroShare();
      zeroShare = new computationClient.SecretShare(
        zeroShare,
        [1, "s1"],
        2,
        computationClient.Zp,
      );
      // Send all the shares of the analyst to the analyst (they should be encrypted)
      // Keep the shares of the server here.
      let analystShares = [];
      let serverShares = {
        tokens: [],
        inputs: [],
      };
      for (let i = 0; i < DB.length; i++) {
        const token = DB[i]["token"];
        const input = DB[i]["input"];
        analystShares.push({
          token: token["analystShare"],
          input: input["analystShare"],
        });
        serverShares.tokens.push(token["serverShare"]);
        serverShares.inputs.push(input["serverShare"]);
      }

      // send the analyst shares to the analyst (party with id = 1).
      computationClient.emit("shares", [1], JSON.stringify(analystShares));

      // turn the server shares to JIFF secret share objects.
      let inputShares = [];
      console.log(serverShares);
      for (let i = 0; i < serverShares["inputs"].length; i++) {
        inputShares.push(
          new computationClient.SecretShare(
            serverShares["inputs"][i],
            [1, "s1"],
            2,
            computationClient.Zp,
          ),
        );
      }

      // calculate sum
      let output = 0;
      console.log(inputShares);
      if (inputShares.length > 0) {
        let sum = zeroShare;
        for (let i = 0; i < inputShares.length; i++) {
          sum = sum.sadd(inputShares[i]);
        }
        // reveal results
        output = await computationClient.open(sum, [1, "s1"]);
      }
      console.log("Result is", output);
      computationClient.disconnect(true, true);
      server.close();
    });
  });
}

main();
