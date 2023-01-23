const genTx = (tx, ocean) => {
  if(ocean.chainId == 56) {
    let ret = {
      ...tx,
      common: {
        baseChain: 'mainnet',
        hardfork: 'petersburg',
        customChain: {
          name: 'custom-chain',
          chainId: 56,
          networkId: 56
        },
      },
      type: 0,
      chainId: 56,
      networkId: 56,
    }
    return ret;
  }
  else if(ocean.chainId == 5) {
    return tx;
  }
  return tx;
};

module.exports = {
  genTx,
};