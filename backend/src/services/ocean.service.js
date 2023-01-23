const ethers = require("ethers");
const Web3   = require("web3");
const bip39  = require("bip39");
const RsaService = require('./rsa.service');
const FishnetService = require('./fishnet.service');
const base64 = require('base-64');
const { Fishnet, Basket, Ocean } = require('../models');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const processPacket = async (ocean, baskets, fishnets, tx) => {
  try {
    let buyerAddr = tx.from;
    let path = null;
    let amount = 0;
    let decodedInput = null;
    try {
      const inter = new ethers.utils.Interface(ocean.routerAbi);
      decodedInput = inter.parseTransaction({ data: tx.input, value: tx.value });
    }
    catch(err) {
      console.log(err);
      return;
    }

    if (decodedInput === null) return;

    if (decodedInput.name === 'swapExactTokensForTokens') {
      path = [ decodedInput.args.path[0], decodedInput.args.path[decodedInput.args.path.length - 1] ];
      amount = decodedInput.args.amountIn;
      buyerAddr = decodedInput.args.to;
    }
    else if (decodedInput.name === 'swapTokensForExactTokens') {
      path = [ decodedInput.args.path[0], decodedInput.args.path[decodedInput.args.path.length - 1] ];
      amount = decodedInput.args.amountInMax; /// ?
      buyerAddr = decodedInput.args.to;
    }
    else if (decodedInput.name === 'swapExactETHForTokens') {
      path = [ decodedInput.args.path[0], decodedInput.args.path[decodedInput.args.path.length - 1] ];
      amount = tx.value;
      buyerAddr = decodedInput.args.to;
    }
    else if (decodedInput.name === 'swapETHForExactTokens') {
      path = [ decodedInput.args.path[0], decodedInput.args.path[decodedInput.args.path.length - 1] ];
      amount = tx.value;   ///?
      buyerAddr = decodedInput.args.to;
    }
    else if (decodedInput.name === 'swapExactTokensForTokensSupportingFeeOnTransferTokens') {
      path = [ decodedInput.args.path[0], decodedInput.args.path[decodedInput.args.path.length - 1] ];
      amount = decodedInput.args.amountIn;
      buyerAddr = decodedInput.args.to;
    }
    else if (decodedInput.name === 'swapExactETHForTokensSupportingFeeOnTransferTokens') {
      path = [ decodedInput.args.path[0], decodedInput.args.path[decodedInput.args.path.length - 1] ];
      amount = tx.value; 
      buyerAddr = decodedInput.args.to;
    }
    else {
      return;
    }
    
    
    if(baskets.findIndex((v) => v.address.toLowerCase() === buyerAddr.toLowerCase()) !== -1) {
      console.log('Skipping - bot purchase...');
      return;
    }
    if (fishnets.findIndex((v) => v.baitAddr.toLowerCase() === path[1].toLowerCase()) === -1) {
      console.log('Skipping - not my net');
      return;
    }
    const fishnet = fishnets[0];

    if(fishnet.extTxns.findIndex((v) => v.txnHash.toLowerCase() === tx.hash.toLowerCase()) !== -1) {
      console.log('Skipping - already tracked');
      return;
    }

    const txn_index = fishnet.extTxns.findIndex((v) => v.from.toLowerCase() === buyerAddr.toLowerCase());

    amount = Web3.utils.fromWei(amount, ocean.ether);

    if (txn_index === -1) {
      fishnet.extTxns.push({
        from: buyerAddr,
        amount: amount,
        txnHash: tx.hash,
        createdAt: new Date(),
        type: 0,
        status: 0,
        blockHash: '',
        blockedAt: null,
      });
    }
    else {
      fishnet.extTxns[txn_index].amount = amount;
      fishnet.extTxns[txn_index].txnHash = tx.hash;
    }
    await fishnet.save();
    if (txn_index === -1) {
      // need to block now
      FishnetService.blockBuyer(fishnet, buyerAddr, tx.hash);
    }
    console.log(buyerAddr, `${amount} ${ocean.unit}`, path[0]);
  }
  catch(err) {
    console.log('Process', err);
  }
};

const startOne = async (ocean_id) => {
  let ocean;
  try {
    ocean = await Ocean.findById(ocean_id);
  }
  catch(err) {
    console.log('Ocean process (exiting) - ', err);
    return;
  }

  console.log(`Ocean [${ocean.name}] listening started on ${ocean.serverUrl}...`);
  let currentBlock = 24938275; // 'latest'
  const provider = new Web3(ocean.serverUrl);

  const baskets = await Basket.find({ status: 1 });
  const fishnets = await Fishnet.find({ status: 1 });
  console.log(`Available fishnets - ${fishnets.length}`);

  while (ocean.status) {
    let block = null;
    try {
      block = await provider.eth.getBlock(currentBlock);
      currentBlock = block.number + 1;
    }
    catch(err) {
      console.log('Ocean process - ', err);
    }
    if (block !== null && block.transactions !== null) {
      for (let txHash of block.transactions) {
        try {
          let tx = await provider.eth.getTransaction(txHash);
          if (tx && tx.to.toLowerCase() === ocean.routerAddr.toLowerCase()) {
            processPacket(ocean, baskets, fishnets, tx);
          }
        }
        catch(err) {
          console.log('Ocean process - ', err);
        }
      }
    }
    //
    try {
      ocean = await Ocean.findById(ocean_id);
      if (ocean.status === 0) {
        console.log(`Ocean [${ocean.name}] listening stoped`);
        return;
      }
    }
    catch(err) {
      console.log('Ocean process - ', err);
    }
  }
};

const startAll = async () => {
  try {
    oceans = await Ocean.find({ status: 1});
    oceans.forEach((ocean) => startOne(ocean.id))
  }
  catch(err) {
    return Promise.reject(err);
  }
};


module.exports = {
  startOne,
  startAll,
  processPacket,
};