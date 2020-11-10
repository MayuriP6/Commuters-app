 const express = require('express');
const app = express();
const toursController = require('../Controller/toursController.js');
const reviewRouter = require('../Routes/reviewRoute.js');
const authContoller = require('./../Controller/authController.js');
const Router = express.Router();

app.use('/api/v1/tours', Router);

//alias route technnique is used to route to the request that is very popular
/*we are using tourRouter.aliasRoute as the middleware to prefill the query strings
The query string will be like ?limit=5&sort=-ratingsAverage, price  */
Router.route('/top-5-cheap').get(
  toursController.aliasRoute,
  toursController.getAllTours
);
Router.route('/tour-stats').get(toursController.getTourStats);
Router.route('/monthlyplan/:year').get(
  authContoller.protect,
  authContoller.restrictTo('admin', 'lead-guide', 'guide'),
  toursController.getMonthlyPlan
);

//  /tours-within?distance=233 &center=-40,40&unit=mi  --we can do this
//  /tours-within/233/center/34.111745,-118.113491/unit/mi  --we are doing this
Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(
  toursController.getToursWithin
);

Router.route('/distances/:latlng/unit/:unit').get(toursController.getDistance);

Router.route('/')
  .get(toursController.getAllTours) //we want api to be public
  .post( 
    authContoller.protect,
    authContoller.restrictTo('admin', 'lead-guide'),
    toursController.postATour
  );

Router.route('/:ide')
  .get(toursController.getATour)
  .patch(
    authContoller.protect,
    authContoller.restrictTo('admin', 'lead-guide'),
    toursController.uploadaTourImages,
    toursController.resizeTourImages,
    toursController.updateATour
  )
  .delete(
    authContoller.protect,
    authContoller.restrictTo('admin', 'lead-guide'),
    toursController.deleteATour
  );

/*nested routes--
Router.route('/:tourId/reviews').post(
    authContoller.protect,
    authContoller.restrictTo('user'),
    reviewController.createReview
  )*/
//alternative way of nested routes
Router.use('/:tourId/reviews', reviewRouter);

module.exports = Router;
