const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const basketSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'User',
    },
    ocean: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'Ocean',
    },
    type: {
      type: Number,
      required: true,
      default: 0, // 0 - bot, 1 - fisher, 2 - saving
    },
    keyPhrase: {
      type: String,
      required: true,
      index: false,
    },
    address: {
      type: String,
      required: true,
      index: false,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    checksum: {
      type: String,
      required: true,
      index: false,
    },
    status: {
      type: Number,
      required: true,
      default: 1, // 0 - inactive, 1 - active
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
basketSchema.plugin(toJSON);

/**
 * @typedef Basket
 */
const Basket = mongoose.model('Basket', basketSchema);

module.exports = Basket;
