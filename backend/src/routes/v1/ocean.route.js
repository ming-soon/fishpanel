const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const oceanValidation = require('../../validations/ocean.validation');
const oceanController = require('../../controllers/ocean.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(oceanValidation.createOcean), oceanController.createOcean)
  .get(auth(),  oceanController.getAll);

router
  .route('/:id')
  .get(auth(), oceanController.getOne)
  .patch(auth(), validate(oceanValidation.updateOcean), oceanController.updateOcean)
  .delete(auth(), validate(oceanValidation.deleteOcean), oceanController.deleteOcean);
  router
    .route('/:id/process')
    .post(auth(), validate(oceanValidation.processOcean), oceanController.processOcean);

module.exports = router;
