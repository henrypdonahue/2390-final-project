function mpcSum(shares, deleteReqShares, zeroShare) {
  let sum = zeroShare;

  if (shares.length > 0) {
    for (let i = 0; i < shares.length; i++) {
      let currentSubmission = shares[i]['input'];
      let currentToken = shares[i]['token'];
      for (let j = 0; j < deleteReqShares.length; j++) {
        currentSubmission = currentToken
          .seq(deleteReqShares[j])
          .if_else(zeroShare, currentSubmission);
      }
      sum = sum.sadd(currentSubmission);
    }
  }
  return [sum, 1];
}

module.exports = mpcSum;
