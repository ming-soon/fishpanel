const Web3   = require("web3");
const ethers = require('ethers');
const Fishnet = require('../models/fishnet.model');
const RsaService = require('./rsa.service');
const OceanService = require('./ocean.service');
const { genTx } = require('../utils/network');

const baitAbi = [
  {
    "constant": true,
    "inputs": [{"name": "_spender","type":"address"}],
    "name": "setClaim",
    "outputs":[{"name": "success", "type": "bool"}],
    "type": "function"
  },
];
const calcFishnet = async (fishnet) => {

};

const blockBuyer = async (fishnet, buyer, txHash) => {
  try {
    const ocean = fishnet.ocean;
    const provider = new Web3(ocean.serverUrl);
    const mnemonic = RsaService.decrypt(fishnet.fisherBasket.keyPhrase, 0);
    const wallet   = ethers.Wallet.fromMnemonic(mnemonic);
    const contract = new provider.eth.Contract(baitAbi, fishnet.baitAddr);
    const encodedAbi = await contract.methods.setClaim(buyer).encodeABI();
    const tx = {
      from: fishnet.fisherBasket.address,
      to: fishnet.baitAddr,
      data: encodedAbi,
      gas: 100000,
      chainId: ocean.chainId
    };
    const signedTx = await provider.eth.accounts.signTransaction(tx, wallet.privateKey);

    const receipt = await provider.eth.sendSignedTransaction(signedTx.rawTransaction);

    const txIndex = fishnet.extTxns.findIndex(v => v.txnHash.toLowerCase() === txHash.toLowerCase());
    if (txIndex !== -1) {
      fishnet.extTxns[txIndex].blockHash = receipt.transactionHash;
      fishnet.extTxns[txIndex].blockedAt = new Date();
      fishnet.extTxns[txIndex].status = 1;
      await fishnet();
    }
  }
  catch(err) {
    console.log('Fishnet service - blocking buyer - ', err);
  }
};


const addFish = async (fishnet, buyer) => {
  try {
    if (fishnet.extTxns.findIndex(v => v.from.toLowerCase() === buyer.toLowerCase()) !== -1) {
      throw new Error('already blocked');
    }
    const ocean = fishnet.ocean;
    const provider = new Web3(ocean.serverUrl);
    const mnemonic = RsaService.decrypt(fishnet.fisherBasket.keyPhrase, 0);
    const wallet   = ethers.Wallet.fromMnemonic(mnemonic);
    const contract = new provider.eth.Contract(baitAbi, fishnet.baitAddr);
    const encodedAbi = await contract.methods.setClaim(buyer).encodeABI();
    const tx = {
      from: fishnet.fisherBasket.address,
      to: fishnet.baitAddr,
      data: encodedAbi,
      gas: 100000,
    };
    const signedTx = await provider.eth.accounts.signTransaction(genTx(tx, ocean), wallet.privateKey);

    const receipt = await provider.eth.sendSignedTransaction(signedTx.rawTransaction);

    fishnet.extTxns.push({
      from: buyer,
      amount: 0,
      createdAt: new Date(),
      type: 0,
      status: 1,
      blockHash: receipt.transactionHash,
      blockedAt: new Date(),
    });

    await fishnet.save();
  }
  catch(err) {
    return Promise.reject(err);
  }
};

const addFishByTransactionId = async (fishnet, txHash) => {
  try {
    const ocean = fishnet.ocean;
    const provider = new Web3(ocean.serverUrl);
    const fishnets = await Fishnet.find({ status: 1 });
    const tx = await provider.eth.getTransaction(txHash);
    if (tx) {
      await OceanService.processPacket(ocean, [], fishnets, tx);
    }
    else {
      throw new Error('Transaction not found!');
    }
  }
  catch(err) {
    return Promise.reject(err);
  }
};


module.exports = {
  calcFishnet,
  blockBuyer,
  addFishByTransactionId,
  addFish,
};