const express = require('express');
const authRoute = require('./auth.route');
const oceanRoute = require('./ocean.route');
const basketRoute = require('./basket.route');
const fishnetRoute = require('./fishnet.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/oceans',
    route: oceanRoute,
  },
  {
    path: '/baskets',
    route: basketRoute,
  },
  {
    path: '/fishnets',
    route: fishnetRoute,
  },
];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});


module.exports = router;
