const express = require('express');
const reviewController = require('./../Controller/reviewContoller.js');
const authContoller = require('./../Controller/authController.js');

const router = express.Router({ mergeParams: true });
/*thir router will have access to all the parameters that are in this route.but wont have access to 
parameters of other route eg-tourId .so in order to provide access to other parameter like tourId we will
write mergeParams:true*/
/*in this ,the post will work for 2 routes
post- api/v1/tours/2432583cdfwsg/reviews   & post- api/vi/reviews*/

/*get will work for 2 routes
get-api/v1/tours/24325613dshcb/reviews & get -api/v1/reviews*/
router.use(authContoller.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authContoller.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:ide')
  .get(reviewController.getAReview)
  .delete(
    authContoller.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authContoller.restrictTo('user', 'admin'),
    reviewController.updateReview
  );
module.exports = router;
