const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { Ocean } = require('../models');
const OceanService = require('../services/ocean.service');

const createOcean = catchAsync(async (req, res) => {
  const body = { ...req.body, user: req.user.id }
  const ocean = await Ocean.create(body);
  res.status(httpStatus.CREATED).send(ocean);
});

const getAll = catchAsync(async (req, res) => {
  const result = await Ocean.find({ user: req.user.id });
  res.send(result);
});

const getOne = catchAsync(async (req, res) => {
  const ocean = await Ocean.findById(req.params.id);
  if (!ocean || ocean.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ocean not found');
  }
  res.send(ocean);
});

const updateOcean = catchAsync(async (req, res) => {
  var ocean = await Ocean.findById(req.params.id);
  if (!ocean || ocean.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, req.user.id);
  }
  Object.assign(ocean, req.body);
  await ocean.save();
  res.send(ocean);
});

const deleteOcean = catchAsync(async (req, res) => {
  const ocean = await Ocean.findById(req.params.id);
  if (!ocean || ocean.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ocean not found');
  }
  await ocean.remove();
  res.status(httpStatus.NO_CONTENT).send();
});

const processOcean = catchAsync(async (req, res) => {
  const ocean = await Ocean.findById(req.params.id);
  if (!ocean || ocean.user != req.user.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ocean not found');
  }
  ocean.status = req.body.status;
  await ocean.save();
  OceanService.startOne(ocean.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createOcean,
  getAll,
  getOne,
  updateOcean,
  deleteOcean,
  processOcean,
};
