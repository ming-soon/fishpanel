const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const externalTxnSchema = mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  txnHash: {
    type: String,
    required: false,
    default: "",
  },
  createdAt: {
    type: Date,
    required: false,
    default: new Date(),
  },
  type: {
    type: Number,
    required: false,
    default: 0,   // 0 - buy, 1 - sell,
  },
  status: {
    type: Number,
    required: false,
    default: 0,   // 0 - unblocked, 1 - blocked
  },
  blockHash: {
    type: String,
    required: false,
    default: "",
  },
  blockedAt: {
    type: Date,
    required: false,
    default: null,
  },
  payload: {
    type: String,
    required: false,
    default: "",
  }
});
const internalTxnSchema = mongoose.Schema({
  basket: {
    type: mongoose.SchemaTypes.ObjectId,
    required: false,
    ref: 'Basket',
  },
  amount: {
    type: Number,
    required: false,
    default: 0,
  },
  fee: {
    type: Number,
    required: false,
    default: 0,
  },
  buyTxnHash: {
    type: String,
    required: false,
    default: "",
  },
  sellTxnHash: {
    type: String,
    required: false,
    default: "",
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  status: {
    type: Number,
    required: true,
    default: 0,   // 0 - standby, 1 - bought, 2 - sold, 3 - error
  },
});
const fishnetSchema = mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      default: "",
    },
    baitAddr: {
      type: String,
      required: true,
      default: "",
    },
    netAddr: {
      type: String,
      required: true,
      default: "", 
    },
    netSize: {
      type: Number,
      required: true,
      default: 0,
    },
    extTxns: [externalTxnSchema],
    intTxns: [internalTxnSchema],
    fisherBasket: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'Basket',
    },
    statistics: {
      baitFee: Number,
      netAddFee: Number,
      netRemoveFee: Number,
      totalInvest: {
        type: Number,
        default: 0,
      },
      totalHarvest: {
        type: Number,
        default: 0,
      },
    },
    remarks: {
      type: String,
      default: '',
    },
    status: {
      type: Number,
      required: true,
      default: 0, // 0 - just created, 1 - playing, 2 - completed
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
fishnetSchema.plugin(toJSON);

/**
 * @typedef Basket
 */
const Basket = mongoose.model('Fishnet', fishnetSchema);

module.exports = Basket;
