const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createOcean = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    factoryAddr: Joi.string(),
    routerAddr: Joi.string().required(),
    swapIdentifier: Joi.string().required(),
    routerAbi: Joi.string().required(),
    serverUrl: Joi.string().required(),
    serverWssUrl: Joi.string().required(),
    explorerUrl: Joi.string(),
    etherAddress: Joi.string().required(),
    ether: Joi.string().required(),
    chainId: Joi.number().required(),
    unit: Joi.string().required(),
  }),
};

const updateOcean = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
      factoryAddr: Joi.string(),
      routerAddr: Joi.string().required(),
      swapIdentifier: Joi.string().required(),
      routerAbi: Joi.string().required(),
      serverUrl: Joi.string().required(),
      serverWssUrl: Joi.string().required(),
      explorerUrl: Joi.string(),
      etherAddress: Joi.string().required(),
      ether: Joi.string().required(),
      chainId: Joi.number().required(),
      unit: Joi.string().required(),
    })
    .min(1),
};

const deleteOcean = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};
const processOcean = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      status: Joi.number().required(),
    })
    .min(1),
};


module.exports = {
  createOcean,
  updateOcean,
  deleteOcean,
  processOcean,
};
