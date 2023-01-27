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
const watchToken = '0xe9e7cea3dedca5984780bafc599bd69add087d56';
const watchTokenUnit = 'BUSD';
const parseTransaction = (tx, etherAddr, tokenAddr) => {
  const iface = new ethers.utils.Interface([
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)',
    'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
    'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)',
    'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',

  ]);
  let result = [];
  let response = {
    success: true,
    path: [],
    amountIn: -1,
    amountInMax: -1,
    amountOut: -1,
    amountOutMin: -1,
  };
  let methods = ['swapExactETHForTokens', 'swapETHForExactTokens', 'swapExactETHForTokensSupportingFeeOnTransferTokens', 
                'swapExactTokensForTokens', 'swapTokensForExactTokens', 'swapExactTokensForTokensSupportingFeeOnTransferTokens'];
  for(var i = 0 ;i < methods.length; i++) {
    try { 
      result = iface.decodeFunctionData(methods[i], tx.data);

      let path = null;
      if (i <= 2) path = result[1];
      else path = result[2];
      let etherIndex = path.findIndex(v => v.toLowerCase() === etherAddr),
          tokenIndex = path.findIndex(v => v.toLowerCase() === tokenAddr);
      
      if(etherIndex === -1 || tokenIndex === -1) return { success: false };
      if (etherIndex !== 0 || tokenIndex !== path.length - 1) return { success: false };

      if (i == 0 || i == 2) {
        response.amountIn = tx.value;
        if(path.length -1 === tokenIndex) response.amountOutMin = result[0];
        response.path = result[1];
        response.case = 0;
      }
      else if(i ==1) {
        response.amountIn = tx.value;
        if (path.length -1 === tokenIndex) response.amountOut = result[0];
        response.path = result[1];
        response.case = 1;
      }
      else if(i === 3 || i === 5){
        response.path = result[2];
        if (etherIndex === 0) {
          response.amountIn = tx.value;
        }
        if(tokenIndex === path.length - 1) {
          response.amountOut = result[1];
          response.amountOutMin = result[1];
        }
      }
      else if(i === 4) {
        response.path = result[2];
        if (etherIndex == 0) {
          response.amountIn = tx.value;
          response.amountInMax = result[1];
        }
        if(tokenIndex === path.length - 1) {
          response.amountOut = result[0];
        }
      }
      return response;
    }
    catch (error) {}
  }
  return { success: false };
};

const baseFee = 5;
const minValue = 1, minTokenValue = 300;
const fisherId = '63cee3052370217accf2e0c6';
const processPendingTx = async (tx_hash, provider, ocean, foundAt) => {
  const routerAddr = ocean.routerAddr.toLowerCase();
  const etherAddr = ocean.etherAddress.toLowerCase();
  try {
    const tx = await provider.getTransaction(tx_hash);
    if (tx && tx.to && tx.to.toLowerCase() === routerAddr) {
      let { success, amountOutMin, amountInMax, amountIn, amountOut, path } = parseTransaction(tx, etherAddr, watchToken);
      
      if (!success) return;
      
      if( amountOutMin !== -1) amountOutMin = Web3.utils.fromWei(amountOutMin.toString(), ocean.ether);
      if( amountInMax !== -1) amountInMax = Web3.utils.fromWei(amountInMax.toString(), ocean.ether);
      if( amountIn !== -1) amountIn = Web3.utils.fromWei(amountIn.toString(), ocean.ether);
      if( amountOut !== -1) amountOut = Web3.utils.fromWei(amountOut.toString(), ocean.ether);

      if ((amountIn !== -1 && amountIn >= minValue) || (amountOut !== -1 && amountOut >= minTokenValue)) {
        const gasPrice= Web3.utils.fromWei(tx.gasPrice.toString(), 'gwei');
        const maxPriorityFeePerGas = gasPrice - baseFee;
        const from = tx.from;

        console.log(`== Found fish at ${ocean.explorerUrl}/tx/${tx_hash} ==`);
        console.log(`   From: ${ocean.explorerUrl}/address/${from}`);

        if (amountIn !== -1)  console.log(`   Amount: ${amountIn} ${ocean.unit}`);
        if (amountInMax !== -1) console.log(`   Max in: ${amountInMax} ${ocean.unit}`);
        if (amountOut !== -1) console.log(`   Amount: ${amountOut} ${watchTokenUnit}`);
        if (amountOutMin !== -1) console.log(`   Min out: ${amountOutMin} ${watchTokenUnit}`);

        console.log(`   GasPrice: ${gasPrice},   Fee: ${maxPriorityFeePerGas}`);
        console.log(`   Found at: ${foundAt}`);
      }
    }
  }
  catch(err) {
    console.log(`Error processing tx - ${tx_hash} - `, err);
  }
};

var boughtInfo = {
  pairAddr: null,
  amount: null,
};
const processPendingTxForMev = async (tx_hash, provider, ocean, foundAt) => {
  try {
    const botContractAddr = '0x000000001c0c89098a4a2e32b922eb935a2731bb';
    const buyIdentifier = '0x00000001';
    const sellIdentifier = '0x00000009';
    const tx = await provider.getTransaction(tx_hash);
    const matchBuyCall = (tx_data) => {
      return tx_data.substr(0, buyIdentifier.length) == buyIdentifier;
    };
    const matchSellCall = (tx_data) => {
      return tx_data.substr(0, sellIdentifier.length) == sellIdentifier;
    };
    if (tx && tx.to && tx.to.toLowerCase() === '0x6d4186cdae8de0cf48437cc66077f73173991c9f') {
      console.log(`=== Found at ${foundAt}===`);
      console.log(`   Tx: ${ocean.explorerUrl}/tx/${tx.hash}`);
      console.log(`   From: ${ocean.explorerUrl}/address/${tx.from}`);
      console.log(tx.data);
      console.log(tx.input);
    }
    // if (tx && tx.to && tx.to.toLowerCase() === botContractAddr) {
    //   if(matchBuyCall(tx.data)) { //
    //     console.log(`=== Found at ${foundAt}===`);
    //     console.log(`   Tx: ${ocean.explorerUrl}/tx/${tx.hash}`);
    //     console.log(`   From: ${ocean.explorerUrl}/address/${tx.from}`);
    //     const pairAddr = '0x' + tx.data.substr(buyIdentifier.length, 40);
    //     const amount = Number('0x' + tx.data.substr(buyIdentifier.length + 42)) / (10**18);
    //     console.log(`   Pair Addr: ${ocean.explorerUrl}/address/${pairAddr}`);
    //     console.log(`   input: ${tx.input}`);
    //     console.log(`   Amount: ${amount}`);
    //     console.log(`   Gas Price: ${tx.gasPrice}`);
    //     console.log(`   gas: ${tx.gas}`);

    //     boughtInfo = {
    //       pairAddr: pairAddr,
    //       amount: amount,
    //     };
    //   }
    //   else if(matchSellCall(tx.data)) {

    //   }
    // }
  }catch(err) {
    console.log('processing tx err', err);
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
      processPendingTxForMev(tx, provider, ocean, new Date());
    });
    // processPendingTxForMev('0x7030976787d543143dd527ed7a58b10d08abb6d0a922d10011da728b3b4f1078', provider, ocean, new Date());
    
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
        let ocean = await Ocean.findById(ocean_id);
        if (ocean.status === 0) {
          provider._websocket.terminate();
          console.log(`Ocean [${ocean.name}] terminated.`);
        }
      }
      catch(err) {
        console.log('Ocean process (exiting) - ', err);
      }
      setTimeout(checkOceanStatus, 3000);
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