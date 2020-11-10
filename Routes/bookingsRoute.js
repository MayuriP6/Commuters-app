 const express=require('express')
 const bookingsContoller=require('../Controller/bookingsController.js')
 const authController=require('../Controller/authController.js')
 const router=express.Router()
 router.use(authController.protect)
 router.get('/checkout-session/:tourId',authController.protect,bookingsContoller.getCheckoutSession)   //this router is for client ot get the checkout session

 router.use(authController.restrictTo('admin'))
 router.route('/').get(bookingsContoller.getAllBookings).post(bookingsContoller.createBooking)
 router.route('/:ide').patch(bookingsContoller.updateBooking).get(bookingsContoller.getBooking).delete(bookingsContoller.deleteBooking)
 module.exports=router