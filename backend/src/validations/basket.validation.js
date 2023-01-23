const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createBasket = {
  body: Joi.object().keys({
    ocean: Joi.required().custom(objectId),
    count: Joi.number().integer().min(1).max(100).required(),
    type: Joi.number().integer().min(0).max(2).required(),
  }),
};

const updateBasket = {
  body: Joi.object().keys({
    ocean: Joi.custom(objectId),
    type: Joi.number().integer().min(0).max(2),
    status: Joi.number().integer().min(0).max(1),
  }),
};

const transferBasket = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      toAddress: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      gas: Joi.number().min(0).required(),
      maxFeePerGas: Joi.number().min(0).required(),
      maxPriorityFeePerGas: Joi.number().min(0).required(),
    })
    .min(1),
};

const importBasket = {
  body: Joi.object()
  .keys({
    keys: Joi.string().required(),
    ocean: Joi.required().custom(objectId),
    type: Joi.number().integer().min(0).max(2).required(),
  }).min(1),
}

const deleteBasket = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createBasket,
  updateBasket,
  transferBasket,
  deleteBasket,
  importBasket,
};
