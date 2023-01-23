const { number } = require('joi');
const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const oceanSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    factoryAddr: {
      type: String,
      required: true,
      index: false,
    },
    routerAddr: {
      type: String,
      required: true,
      index: false,
    },
    serverUrl: {
      type: String,
      required: true,
      index: false,
    },
    serverWssUrl: {
      type: String,
      required: true,
      index: false,
    },
    swapIdentifier: {
      type: String,
      required: true,
      default: '',
    },
    routerAbi: {
      type: String,
      required: true,
      default: '',
    },
    etherAddress: {
      type: String,
      required: true,
      index: false,
      default: '',
    },
    ether: {
      type: String,
      required: true,
      index: false,
      default: 'ether',
    },
    unit: {
      type: String,
      required: true,
      default: 'eth',
    },
    status: {
      type: Number,
      required: true,
      default: 0,     // 0 - not running, 1 - running
    },
    explorerUrl: {
      type: String,
      required: true,
      index: false,
    },
    chainId: {
      type: Number,
      required: false,
      index: false,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
oceanSchema.plugin(toJSON);

/**
 * @typedef Ocean
 */
const Ocean = mongoose.model('Ocean', oceanSchema);

module.exports = Ocean;
