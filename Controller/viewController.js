const Tour = require('./../Models/tourModels.js');
const User = require('./../Models/userModel.js');
const catchasync = require('./../utils/asyncError.js');
const AppError = require('./../utils/appError.js');
const Booking=require('./../Models/bookingModel.js');
const asyncError = require( './../utils/asyncError.js' );
exports.getOverview = catchasync(async (req, res, next) => {
  //1)GET TOUR DATA FROM COLLECTION
  const tours = await Tour.find();

  //2)BUILD TEMPLATE
  //3)RENDER THAT TEMPLATE USING TOUR DATA FROM 1
  res.status(200).render('overview', {
    title: 'All tours',
    tours: tours,
  });
});

exports.getTour = catchasync(async (req, res, next) => {
  //1)GET THE DATA FOR THE REQUESTED TOUR
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('No tour with that name', 404));
  }
  //2)BUILD TEMPLATE
  //3)RENDER TEMPLATE USING DATA FROM 1
  res.status(200)/*.set(
    'Content-Security-Policy',
    'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com'
  )*/.render('tour', {
    title:`${tour.name}`,
    tour: tour,
  });
  next();
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchasync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

exports.getMyTours=asyncError(async(req,res,next)=>{
//1)find booking with the currently logged in user
  const bookings=await Booking.find({user:req.user.id})
  
//2)find tours for the  returned ids
  const tourId=bookings.map(el=>el.tour.id) //tourId is now an array of all ids
  const tours=await Tour.find({_id:{$in:tourId}})  //we will get all the tour for the d's that are in tourId
  console.log("tours----",tours)
  res.status(200).render('overview',{
    title:'My Tours',
    tours:tours
  })
})