const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { Basket } = require('../models');
const BasketService = require('../services/basket.service');
const RsaService = require('../services/rsa.service');

const createBasket = catchAsync(async (req, res) => {
  for(let i = 0; i < req.body.count; i++) {
    let payload = await BasketService.createBasket();
    await Basket.create({ 
      ...payload,
      user: req.user.id,
      ocean: req.body.ocean,
      type: req.body.type
    });
  }
  res.status(httpStatus.NO_CONTENT).send();
});

const getAll = catchAsync(async (req, res) => {
  var query = { user: req.user.id };
  if( req.query.ocean ) query.ocean = req.query.ocean;
  if( req.query.type ) query.type = req.query.type;
  if( req.query.status ) query.status = req.query.status;
  const result = await Basket.find(query).populate(['ocean']);
  const baskets = [];
  const balances = req.query.fetchBalance === 'true' && result.length > 0 ? await BasketService.balanceOf(result, req.query.baitAddr) : [];
  for(let i = 0; i < result.length; i++) {
    baskets.push({
      id: result[i].id,
      ocean: result[i].ocean,
      type: result[i].type,
      address: result[i].address,
      status: result[i].status,
      balance: balances[i] ? balances[i][0] : result[i].balance,
      baitBalance: balances[i] && req.query.baitAddr ? balances[i][1] : 0,
      checksum: RsaService.verify(result[i].address, result[i].checksum),
      createdAt: result[i].createdAt,
      updatedAt: result[i].updatedAt,
    });
    if(balances[i]) {
      result[i].balance = balances[i][0];
      await result[i].save();
    }
  }
  res.send(baskets);
});

const getOne = catchAsync(async (req, res) => {
  const basket = await Basket.findById(req.params.id).populate(['ocean']);
  if (!basket || basket.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Basket not found');
  }
  basket.balance = await BasketService.balanceOf(basket);
  basket.checksum = RsaService.verify(basket.address, basket.checksum);
  res.send(basket);
});

const updateBasket = catchAsync(async (req, res) => {
  var basket = await Basket.findById(req.params.id);
  if (!basket || basket.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, req.user.id);
  }
  var payload = {};
  if('ocean' in req.body) payload.ocean = req.body.ocean;
  if('type' in req.body) payload.type = req.body.type;
  if('status' in req.body) payload.status = req.body.status;
  Object.assign(basket, payload);
  await basket.save();
  res.send(basket);
});

const deleteBasket = catchAsync(async (req, res) => {
  const basket = await Basket.findById(req.params.id);
  if (!basket || basket.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Basket not found');
  }
  basket.status = 0;
  await basket.save();
  res.status(httpStatus.NO_CONTENT).send();
});

const transferBasket = catchAsync(async (req, res) => {
  const basket = await Basket.findById(req.params.id).populate(['ocean']);
  if (!basket || basket.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Basket not found');
  }
  const result = await BasketService.transfer(basket, req.body);

  res.status(httpStatus.NO_CONTENT).send();
});

const revealBasket = catchAsync(async (req, res) => {
  const basket = await Basket.findById(req.params.id).populate(['ocean']);
  if (!basket || basket.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Basket not found');
  }
  const result = await BasketService.revealBasket(basket);
  res.send(result);
});


const importBasket = catchAsync(async (req, res) => {
  let payload = await BasketService.importBasket(req.body.keys);
  await Basket.create({ 
    ...payload,
    user: req.user.id,
    ocean: req.body.ocean,
    type: req.body.type
  });
  res.status(httpStatus.NO_CONTENT).send();
});


module.exports = {
  createBasket,
  getAll,
  getOne,
  updateBasket,
  deleteBasket,
  transferBasket,
  revealBasket,
  importBasket,
};
