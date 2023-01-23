const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const fishnetValidation = require('../../validations/fishnet.validation');
const fishnetController = require('../../controllers/fishnet.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(fishnetValidation.createFishnet), fishnetController.createFishnet)
  .get(auth(),  fishnetController.getAll);

router
  .route('/:id')
  .get(auth(), fishnetController.getOne)
  .patch(auth(), validate(fishnetValidation.updateFishnet), fishnetController.updateFishnet)
  .delete(auth(), validate(fishnetValidation.deleteFishnet), fishnetController.deleteFishnet);

router
  .route('/:id/complete')
  .post(auth(), validate(fishnetValidation.completeFishnet), fishnetController.completeFishnet);

router
  .route('/:id/calc')
  .post(auth(), validate(fishnetValidation.calcFishnet), fishnetController.calcFishnet);

router
    .route('/:id/purchase')
    .post(auth(), validate(fishnetValidation.purchaseFishnet), fishnetController.purchaseFishnet);

router
    .route('/:id/sell/:txn_id')
    .post(auth(), validate(fishnetValidation.sellFishnet), fishnetController.sellFishnet);

router
    .route('/:id/add_fish')
    .post(auth(), validate(fishnetValidation.addFish), fishnetController.addFish);

module.exports = router;
