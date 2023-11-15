// Dependencies
let http = require("http");
const { JIFFServer } = require("jiff-mpc");
const express = require("express");

const app = express();
const port = 8080;

let DB = {};

// Middleware to parse JSON request bodies
app.use(express.json());

// Define an endpoint for submitting data
app.post("/submit", (req, res) => {
  const { token, analystShare, serverShare } = req.body;
  DB[token] = { analyst: analystShare, server: serverShare };
  res.status(200).json({ message: "data submitted successfully" });
});

// Define an endpoint for deleting data based on a token
app.delete("/delete/:token", (req, res) => {
  const { token } = req.params;
  // Check if the token exists in the DB
  if (DB[token]) {
    // Delete the entry corresponding to the token
    delete DB[token];
    res.status(200).json({ message: "data deleted successfully" });
  } else {
    res.status(404).json({ message: "token not found" });
  }
});

http = http.Server(app);

// Create JIFF server
const jiffServer = new JIFFServer(http, { logs: false });
jiffServer.computationMaps.maxCount["test"] = 2;

// Specify the computation server code for this demo
var computationClient = jiffServer.compute("test", { crypto_provider: true });
computationClient.wait_for([1, "s1"], async function () {
  // Perform server-side computation.
  console.log("Computation initialized!");

  // Send all the shares of the analyst to the analyst (they should be encrypted)
  // Keep the shares of the server here.
  let analystShares = [];
  let serverShares = [];
  for (const [token, shares] of Object.entries(DB)) {
    analystShares.push(shares["analyst"]);
    serverShares.push(shares["server"]);
  }

  // send the analyst shares to the analyst (party with id = 1).
  computationClient.emit("shares", [1], JSON.stringify(analystShares));

  // turn the server shares to JIFF secret share objects.
  let shares = [];
  for (let i = 0; i < serverShares.length; i++) {
    shares.push(
      new computationClient.SecretShare(
        serverShares[i],
        [1, "s1"],
        2,
        computationClient.Zp,
      ),
    );
  }

  // Now we can do whatever computation we want. For example, we can add the two submissions together.
  let sum = shares[0];
  for (let i = 1; i < shares.length; i++) {
    sum = sum.sadd(shares[i]);
  }

  // Reveal the result.
  const output = await computationClient.open(sum, [1, "s1"]);
  console.log("Result is", output);
  computationClient.disconnect(true, true);
});

// Start the server
http.listen(port, function () {
  console.log("listening on *:8080");
});
