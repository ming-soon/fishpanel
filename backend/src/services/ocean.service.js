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
const processPendingTx = async (tx_hash, provider, ocean) => {
  const iface = new ethers.utils.Interface([
    'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)',
    'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline)']
  );
  const routerAddr = ocean.routerAddr.toLowerCase();
  const tx = await provider.getTransaction(tx_hash);
  const baseFee = Web3.utils.fromWei(5, 'gwei');
  const tokenList = ['0xe9e7cea3dedca5984780bafc599bd69add087d56'];
  const tokenUnitList = ['BUSD'];
  const minValue = 1;
  if (tx && tx.to.toLowerCase() === routerAddr) {
    let result = [];
    try { result = iface.decodeFunctionData('swapExactETHForTokens', tx.data); }
    catch (error) {
      try { result = iface.decodeFunctionData('swapExactETHForTokensSupportingFeeOnTransferTokens', tx.data) } 
      catch (error) {
        try { result = iface.decodeFunctionData('swapETHForExactTokens', tx.data) } catch (error) { }
      }
    }
    if (result.length > 0 && result[1][result[1].length - 1].toLowerCase() === tokenList[0]) {
      const value = Web3.utils.fromWei(tx.value.toString());
      if( value >= minValue) {
        const gasPrice= Web3.utils.fromWei(tx.gasPrice.toString());
        const gasLimit= Web3.utils.fromWei(tx.gasLimit.toString());
        const maxPriorityFeePerGas = gasPrice - baseFee;
        const from = tx.from;

        console.log(`==Found fish at ${ocean.explorerUrl}/tx/${tx_hash}==`);
        console.log(`   From: ${ocean.explorerUrl}/address/${from}`);
        console.log(`   Amount: ${value} ${ocean.unit}`);
        console.log(`   Min out: ${result[0]} ${tokenUnitList[0]}`);
        console.log(`   GasPrice: ${gasPrice},   Fee: ${maxPriorityFeePerGas}`);
      }
    }
  }
};

const startOne = async (ocean_id) => {
  const init = async () => {
    let ocean;
    try {
      ocean = await Ocean.findById(ocean_id);
    }
    catch(err) {
      console.log('Ocean process (exiting) - ', err);
      return;
    }
    if (ocean.status !== 1) return;
    console.log(`Ocean [${ocean.name}] listening started on ${ocean.serverWssUrl}...`);
    const provider = new ethers.providers.WebSocketProvider(ocean.serverWssUrl);
    provider.on('pending', (tx) => {
      processPendingTx(tx, provider, ocean);
    });
  
    provider._websocket.on('error', () => {
      console.log(`Ocean [${ocean.name}] restarting on error.`);
      setTimeout(init, 1000);
    });
  
    // provider._websocket.on('close', () => {
    //   provider._websocket.terminate();
    //   console.log(`Ocean [${ocean.name}] restarting on close.`);
    //   setTimeout(init, 1000);
    // });

    const checkOceanStatus = async () => {
      try {
        const ocean = await Ocean.findById(ocean_id);
        if (ocean.status === 0) {
          provider._websocket.terminate();
          console.log(`Ocean [${ocean.name}] terminated.`);
        }
      }
      catch(err) {
        console.log('Ocean process (exiting) - ', err);
        return;
      }
    };

    setTimeout(checkOceanStatus, 1000);
  };
  init();
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