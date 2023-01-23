const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { Fishnet, Basket } = require('../models');
const BasketService = require('../services/basket.service');
const FishnetService = require('../services/fishnet.service');
const RsaService = require('../services/rsa.service');
const Web3 = require('web3');
const { sleep } = require('../utils/sleep');

const createFishnet = catchAsync(async (req, res) => {
  const body = {
    user: req.user.id, 
    ocean: req.body.ocean,
    fisherBasket: req.body.fisherBasket,
    name: req.body.name,
    baitAddr: req.body.baitAddr,
    netAddr: req.body.netAddr,
    netSize: req.body.netSize,
    statistics: {
      baitFee: req.body.baitFee,
      netAddFee: req.body.netAddFee,
      netRemoveFee: req.body.netRemoveFee,
    },
    remarks: req.body.remarks,
    status: req.body.status,
    extTxns: [],
    intTxns: [],
  }
  const fishnet = await Fishnet.create(body);
  res.status(httpStatus.CREATED).send(fishnet);
});

const getAll = catchAsync(async (req, res) => {
  var query = { user: req.user.id };
  const result = await Fishnet.find(query).populate(['ocean', 'fisherBasket', { path: 'intTxns', populate: ['basket'] }]);
  res.send(result);
});

const getOne = catchAsync(async (req, res) => {
  const fishnet = await Fishnet.findById(req.params.id).populate(['ocean', 'fisherBasket', { path: 'intTxns', populate: ['basket'] }]);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet not found');
  }
  res.send(fishnet);
});

const updateFishnet = catchAsync(async (req, res) => {
  var fishnet = await Fishnet.findById(req.params.id);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, req.user.id);
  }
  const payload = {
    ocean: req.body.ocean,
    fisherBasket: req.body.fisherBasket,
    name: req.body.name,
    baitAddr: req.body.baitAddr,
    netAddr: req.body.netAddr,
    netSize: req.body.netSize,
    statistics: {
      baitFee: req.body.baitFee,
      netAddFee: req.body.netAddFee,
      netRemoveFee: req.body.netRemoveFee,
    },
    remarks: req.body.remarks,
    status: req.body.status,
  }
  Object.assign(fishnet, payload);
  await fishnet.save();
  res.send(fishnet);
});

const deleteFishnet = catchAsync(async (req, res) => {
  const fishnet = await Fishnet.findById(req.params.id);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet not found');
  }
  await fishnet.remove();
  res.status(httpStatus.NO_CONTENT).send();
});

const completeFishnet = catchAsync(async (req, res) => {
  const fishnet = await Fishnet.findById(req.params.id).populate(['ocean', 'fisherBasket', { path: 'intTxns', populate: ['basket'] }]);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet not found');
  }
  fishnet.status = 2;
  await FishnetService.calcFishnet(fishnet);
  await fishnet.save();
  res.status(httpStatus.NO_CONTENT).send();
});

const calcFishnet = catchAsync(async (req, res) => {
  const fishnet = await Fishnet.findById(req.params.id).populate(['ocean', 'fisherBasket', { path: 'intTxns', populate: ['basket'] }]);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet not found');
  }
  await FishnetService.calcFishnet(fishnet);
  res.status(httpStatus.NO_CONTENT).send();
});


const purchaseFishnet = catchAsync(async (req, res) => {
  const fishnet = await Fishnet.findById(req.params.id).populate(['ocean', 'fisherBasket', { path: 'intTxns', populate: ['basket'] }]);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet not found');
  }
  const maxAmount = parseFloat(req.body.maxAmount);
  const minAmount = parseFloat(req.body.minAmount);
  const gas = parseFloat(req.body.gas);
  const maxFeePerGas = Web3.utils.toWei(req.body.maxFeePerGas.toString(), 'gwei');
  const maxPriorityFeePerGas = Web3.utils.toWei(req.body.maxPriorityFeePerGas.toString(), 'gwei');
  let delay = 0, amount = 0;
  const ocean = fishnet.ocean;
  for(var i = 0 ; i< req.body.count; i++) {
    amount = Math.round((Math.random() * (maxAmount - minAmount) + minAmount) * 1000000000000000000)/1000000000000000000;
    let baskets = await Basket.find({
      ocean: ocean.id,
      type: 0,
      balance: {
        $gte: amount + parseFloat(Web3.utils.fromWei((gas * maxFeePerGas).toString(), ocean.ether))
      },
      status: 1,
    });
    baskets = baskets.filter(b => fishnet.intTxns.findIndex(v => v.basket.address.toLowerCase() === b.address.toLowerCase()) === -1);

    let index = Math.round(Math.random() * baskets.length);
    if (baskets.length === 1) index = 0;
    else if (index === baskets.length) index = index - 1;

    let result = await BasketService.buy(baskets[index], fishnet, {
      amount: amount,
      gas: gas,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
    });

    fishnet.intTxns.push({
      basket: baskets[index].id,
      amount: amount,
      buyTxnHash: result.transactionHash,
      fee: 0,
      createdAt: new Date(),
      status: result.status ? 1 : 3,
    });
    await fishnet.save();

    delay = Math.round(Math.random() * (req.body.maxInterval - req.body.minInterval) + req.body.minInterval);
    await sleep(delay);
  }
  res.status(httpStatus.NO_CONTENT).send();
});




const sellFishnet = catchAsync(async (req, res) => {
  const fishnet = await Fishnet.findById(req.params.id).populate(['ocean', 'fisherBasket', { path: 'intTxns', populate: ['basket'] }]);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet not found');
  }
  const txn_idx = fishnet.intTxns.findIndex(v => v._id.toString() === req.params.txn_id);
  if (txn_idx === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet txn not found');
  }
  let result = await BasketService.sell(fishnet, fishnet.intTxns[txn_idx], {
    gas: req.body.gas,
    maxFeePerGas: req.body.maxFeePerGas,
    maxPriorityFeePerGas: req.body.maxPriorityFeePerGas,
  });
  fishnet.intTxns[txn_idx].sellTxnHash = result.transactionHash;
  if (result.status) {
    fishnet.intTxns[txn_idx].status = 2;
    await fishnet.save();
  }
  else {
    await fishnet.save();
    throw new ApiError(httpStatus.NOT_FOUND, 'Sell txn reverted.');
  }

  res.status(httpStatus.NO_CONTENT).send();
});

const addFish = catchAsync(async (req, res) => {
  const fishnet = await Fishnet.findById(req.params.id).populate(['ocean', 'fisherBasket', { path: 'intTxns', populate: ['basket'] }]);
  if (!fishnet || fishnet.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fishnet not found');
  }

  const some_id = req.body.some_id;
  if(some_id.length > 60) {
    await FishnetService.addFishByTransactionId(fishnet, some_id);
  }
  else {
    await FishnetService.addFish(fishnet, some_id);
  }

  res.status(httpStatus.NO_CONTENT).send();
});



module.exports = {
  createFishnet,
  getAll,
  getOne,
  updateFishnet,
  deleteFishnet,
  completeFishnet,
  calcFishnet,
  purchaseFishnet,
  sellFishnet,
  addFish,
};
