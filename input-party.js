const sodium = require('libsodium-wrappers-sumo');
const { JIFFClient } = require('jiff-mpc');

// Read command line arguments
async function main() {
  const command = process.argv[2];
  let input = process.argv[3];

  await sodium.ready;

  // Share the input with server
  if (command === "input") {
    input = parseInt(input, 10);

    const jiffClient = new JIFFClient('fakeurl', 'fakecomputation', { autoConnect: false });
    
    // send shares along with random token to server via some http request.
    const shares = jiffClient.hooks.computeShares(jiffClient, input, [1, 's1'], 2, jiffClient.Zp)
    const token = Buffer.from(sodium.randombytes_buf(32)).toString('base64');

    console.log(shares);
    console.log("use token to delete:", token);    

  } else if (command === "delete") {
    console.log("deleting token", input);
    // send input to server to delete via some http request.
  }
}

main();