const ethers = require("ethers");
const Web3   = require("web3");
const bip39  = require("bip39");
const RsaService = require('./rsa.service');
const base64 = require('base-64');
const { genTx } = require('../utils/network');

const createBasket = async () => {
  try {
    let mnemonic = bip39.generateMnemonic();
    let wallet   = ethers.Wallet.fromMnemonic(mnemonic);
    let keyPhrase = RsaService.encrypt(mnemonic, 1);
    let address  = wallet.address;
    let checksum = RsaService.sign(address);
    return Promise.resolve({
      keyPhrase,
      address,
      checksum
    });
  }
  catch(err) {
    return Promise.reject(err);
  }
};

const balanceOf = async (baskets) => {
  try {
    let provider = new Web3(baskets[0].ocean.serverUrl);
    let result = [];
    for(let i = 0; i < baskets.length; i++) {
      result.push(Web3.utils.fromWei(await provider.eth.getBalance(baskets[i].address), baskets[i].ocean.ether));
    }
    return Promise.resolve(result);
  }
  catch(err) {
    return Promise.reject(err);
  }
};

const transfer = async (basket, toInfo) => {
  try {
    let provider = new Web3(basket.ocean.serverUrl);
    let amount = Web3.utils.toWei(toInfo.amount.toString(), 'ether');
    mnemonic = RsaService.decrypt(basket.keyPhrase, 0);
    let wallet   = ethers.Wallet.fromMnemonic(mnemonic);
    const tx = {
      from: wallet.address,
      to: toInfo.toAddress,
      value: amount,
    };
    if (toInfo.gas > 0) tx.gas = toInfo.gas;
    if (toInfo.maxPriorityFeePerGas > 0) tx.maxPriorityFeePerGas = Web3.utils.toWei(toInfo.maxPriorityFeePerGas.toString(), 'gwei');
    if (toInfo.maxFeePerGas > 0) tx.maxFeePerGas = Web3.utils.toWei(toInfo.maxFeePerGas.toString(), 'gwei');
    const signedTx = await provider.eth.accounts.signTransaction(genTx(tx, basket.ocean), wallet.privateKey);
    const receipt = await provider.eth.sendSignedTransaction(signedTx.rawTransaction);
    return Promise.resolve(receipt);
  }
  catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

const revealBasket = async (basket) => {
  try {
    val = RsaService.decrypt(basket.keyPhrase, 0);
    return Promise.resolve(base64.encode(val));
  }
  catch(err) {
    return Promise.reject(err);
  }
};

const buy = async (basket, fishnet, info) => {
  try {
    const ocean = fishnet.ocean;
    const provider = new Web3(ocean.serverUrl);
    const mnemonic = RsaService.decrypt(basket.keyPhrase, 0);
    const wallet   = ethers.Wallet.fromMnemonic(mnemonic);
    const contract = new provider.eth.Contract(JSON.parse(ocean.routerAbi), ocean.routerAddr);
    const encodedAbi = await contract.methods.swapExactETHForTokens(0, [ocean.etherAddress, fishnet.baitAddr], basket.address, Math.round(new Date().getTime() / 1000 + 2000)).encodeABI();
    const tx = {
      from: basket.address,
      to: fishnet.ocean.routerAddr,
      data: encodedAbi,
      gas: info.gas,
      maxFeePerGas: info.maxFeePerGas,
      maxPriorityFeePerGas: info.maxPriorityFeePerGas,
      value: Web3.utils.toWei(info.amount.toString(), 'ether'),
    };
    const signedTx = await provider.eth.accounts.signTransaction(genTx(tx, ocean), wallet.privateKey);

    const receipt = await provider.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt;
  }
  catch(err) {
    return Promise.reject(err);
  }
};

const erc20_abi = [
  // balanceOf
  {
    "constant":true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  },
  // decimals
  {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function"
  },
  // approve
  {
    "constant": true,
    "inputs": [{"name": "spender","type":"address"},{"name": "amount","type":"uint256"}],
    "name": "approve",
    "outputs":[{"name": "success", "type": "bool"}],
    "type": "function"
  },
];
const sell = async (fishnet, txn, info) => {
  try {
    const ocean = fishnet.ocean;
    const provider = new Web3(ocean.serverUrl);
    const basket = txn.basket;
    const mnemonic = RsaService.decrypt(basket.keyPhrase, 0);
    const wallet   = ethers.Wallet.fromMnemonic(mnemonic);

    const contract1 = new provider.eth.Contract(erc20_abi, fishnet.baitAddr);
    const balance = await contract1.methods.balanceOf(wallet.address).call();

    const approveAbi = await contract1.methods.approve(ocean.routerAddr, '115792089237316195423570985008687907853269984665640564039457584007913129639935').encodeABI();

    const tx1 = {
      from: wallet.address,
      to: fishnet.baitAddr,
      data: approveAbi,
      gas: info.gas,
      maxFeePerGas: Web3.utils.toWei(info.maxFeePerGas.toString(), 'gwei'),
      maxPriorityFeePerGas: Web3.utils.toWei(info.maxPriorityFeePerGas.toString(), 'gwei'),
    };
    const signedTx1 = await provider.eth.accounts.signTransaction(genTx(tx1, ocean), wallet.privateKey);
    const recept1 = await provider.eth.sendSignedTransaction(signedTx1.rawTransaction);

    let nonce = await provider.eth.getTransactionCount(basket.address, 'latest');
    const contract = new provider.eth.Contract(JSON.parse(ocean.routerAbi), ocean.routerAddr);
    const encodedAbi = await contract.methods.swapExactTokensForETH(balance, 0, [fishnet.baitAddr, ocean.etherAddress], basket.address, Math.round(new Date().getTime() / 1000 + 2000)).encodeABI();
    const tx = {
      from: basket.address,
      to: fishnet.ocean.routerAddr,
      data: encodedAbi,
      gas: info.gas,
      maxFeePerGas: Web3.utils.toWei(info.maxFeePerGas.toString(), 'gwei'),
      maxPriorityFeePerGas: Web3.utils.toWei(info.maxPriorityFeePerGas.toString(), 'gwei'),
      nonce: nonce,
    };
    const signedTx = await provider.eth.accounts.signTransaction(genTx(tx, ocean), wallet.privateKey);

    const receipt = await provider.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt;
  }
  catch(err) {
    return Promise.reject(err);
  }
};

const importBasket = async (keys) => {
  try {
    let wallet   = ethers.Wallet.fromMnemonic(keys);
    let keyPhrase = RsaService.encrypt(keys, 1);
    let address  = wallet.address;
    let checksum = RsaService.sign(address);
    return Promise.resolve({
      keyPhrase,
      address,
      checksum
    });
  }
  catch(err) {
    return Promise.reject(err);
  }
};

module.exports = {
  createBasket,
  balanceOf,
  transfer,
  revealBasket,
  buy,
  sell,
  importBasket,
};