const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const basketValidation = require('../../validations/basket.validation');
const basketController = require('../../controllers/basket.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(basketValidation.createBasket), basketController.createBasket)
  .get(auth(),  basketController.getAll);

router
  .route('/:id')
  .get(auth(), basketController.getOne)
  .patch(auth(), validate(basketValidation.updateBasket), basketController.updateBasket)
  .delete(auth(), validate(basketValidation.deleteBasket), basketController.deleteBasket);

router
  .route('/:id/transfer')
  .post(auth(), validate(basketValidation.transferBasket), basketController.transferBasket);
router
  .route('/:id/reveal')
  .post(auth(), basketController.revealBasket);

router
  .route('/import')
  .post(auth(), validate(basketValidation.importBasket), basketController.importBasket)
module.exports = router;
