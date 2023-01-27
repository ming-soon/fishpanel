const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFishnet = {
  body: Joi.object().keys({
    ocean: Joi.required().custom(objectId),
    fisherBasket: Joi.required().custom(objectId),
    name: Joi.string().required(),
    baitAddr: Joi.string().required(),
    netAddr: Joi.string(),
    netSize: Joi.number(),
    baitFee: Joi.number(),
    netAddFee: Joi.number(),
    netRemoveFee: Joi.number(),
    remarks: Joi.string(),
    status: Joi.number().required(),
  }),
};

const updateFishnet = {
  body: Joi.object().keys({
    ocean: Joi.required().custom(objectId),
    fisherBasket: Joi.required().custom(objectId),
    name: Joi.string().required(),
    baitAddr: Joi.string().required(),
    netAddr: Joi.string(),
    netSize: Joi.number(),
    baitFee: Joi.number(),
    netAddFee: Joi.number(),
    netRemoveFee: Joi.number(),
    remarks: Joi.string(),
    status: Joi.number().required(),
  }),
};


const completeFishnet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const calcFishnet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};
const deleteFishnet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const purchaseFishnet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    count: Joi.number().min(1).required(),
    minAmount: Joi.number().required(),
    maxAmount: Joi.number().required(),
    minInterval: Joi.number().required(),
    maxInterval: Joi.number().required(),
    gas: Joi.number().required(),
    maxFeePerGas: Joi.number().required(),
    maxPriorityFeePerGas: Joi.number().required(),
  }),
}

const purchaseOneFishnet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
    basket_id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    amount: Joi.number().required(),
    gas: Joi.number().required(),
    maxFeePerGas: Joi.number().required(),
    maxPriorityFeePerGas: Joi.number().required(),
  }),
}

const sellOneFishnet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
    basket_id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    gas: Joi.number().required(),
    maxFeePerGas: Joi.number().required(),
    maxPriorityFeePerGas: Joi.number().required(),
  }),
};
const sellFishnet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
    txn_id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    gas: Joi.number().required(),
    maxFeePerGas: Joi.number().required(),
    maxPriorityFeePerGas: Joi.number().required(),
  }),
};


const addFish = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    some_id: Joi.string().required(),
  }),
};

module.exports = {
  createFishnet,
  updateFishnet,
  completeFishnet,
  deleteFishnet,
  calcFishnet,
  purchaseFishnet,
  purchaseOneFishnet,
  sellFishnet,
  sellOneFishnet,
  addFish,
};
