const multer=require('multer')
const sharp=require('sharp');
const Tour = require('../Models/tourModels.js');
const asyncError = require('../utils/asyncError.js');
const AppError = require('../utils/appError.js');
const factory = require('./handlerFactory.js');
exports.aliasRoute = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name,price,summary,ratingsAverage';
  next();
};
exports.getAllTours = factory.getAll(Tour);
exports.getATour = factory.getOne(Tour, { path: 'reviews' });
exports.postATour = factory.createOne(Tour);
exports.updateATour = factory.updateOne(Tour);
exports.deleteATour = factory.deleteOne(Tour);

const multerStorage=multer.memoryStorage()

const multerFilter=(req,file,cb)=>{ //in this we need to check whether the uploaded file is an image or not
//whatever may be the type of image,the mimetype will always start with an image word ,if its a immage else it wont start
  if(file.mimetype.startsWith('image')){
    cb(null,true)
  }else{
    cb(new AppError('Not an image.Please upload only the image',400),false)
  }
}
const upload= multer({
  storage:multerStorage,
  fileFilter:multerFilter
})

/*if their is only 1 field that excepts multiple images- upload.array("images",5)
if their is only 1 field that excepts single images- upload.single("image")
if there are multiple fields- upload.fields([{},{}])*/
exports.uploadaTourImages=upload.fields([
  {name:"imageCover",maxCount:1},
  {name:"images",maxCount:3}
]) 

exports.resizeTourImages=asyncError(async(req,res,next)=>{
  console.log(req.files)
  if (!req.files.imageCover || !req.files.images)  return next()
 
  //1) Cover image
  req.body.imageCover=`tour-${req.params.ide}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/tours/${req.body.imageCover}`) 
  
  //2)images   
  req.body.images=[]
  await Promise.all( req.files.images.map(async(file,i)=>{
    const filename=`tour-${req.params.ide}-${Date.now()}-${i+1}.jpeg`
    await sharp(file.buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/tours/${filename}`) 
    req.body.images.push(filename)
   }) 
  )
  next()
})

/*exports.getAllTours = asyncError(async (req, res, next) => {
  //we need next to pass the error into it and then this
  //error can be handles using global error middleware
  console.log(req.query);*/
/*//1A)   FILTERING
    let queryObj = { ...req.query }; //if a avariable is assigned to the object then with the change in varible,
    //the object do change.So if we write queryObj=req.query then if queryObj chnages then req.query also chnages ,
    //so to avoid this we assign an obj to obj so now even if queryObj changes,req.query wont
    const excludeElement = ['page', 'sort', 'limit', 'fields'];
    excludeElement.forEach((el) => delete queryObj[el]);

    //1B)ADVANCED FILTERING  --
    /* { duration: { lte: '5' } }  ---this is what we get from postman
        duration[lte]=5  --written in postman
        { duration: { $lte: '5' } }  ---this is what we need to send to database*/

/*let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      //replace function can even have the 2ndparameter as callback
      /\b(gte|gt|lte|lt)\b/g,
      (element) => `$${element}`
    );
    queryObj = JSON.parse(queryString); 
    let query = Tour.find(queryObj);*/

// 2) SORTING
/* sort(price averagerating) --this will first sort price and then sort by averagerating(for mongodb)
       sort=price,averagerating   --in postman*/
//price indicated price in asc order and -price indicates price in desc order
/*if (req.query.sort) {
      console.log('entered into sorting');
      let sortBy = req.query.sort.replace(',', ' '); //can even use sort.split(',',' ')
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }*/

//3) FIELD LIMITING
/* ?fields=name,duration,price,difficulty  --written in postman
       {fields:'name','duration','price'}  --got from postman
       select(name duration price)  --for mongodb*/
/*if (req.query.fields) {
      const field = req.query.fields.split(',').join(' ');
      console.log(field);
      query = query.select(field);
    } else {
      query = query.select('-__v'); //- sign in select means excluding
    }*/

//4) PAGINATION
/* ?page=3&limit=10   --wtiten in postman
    It means that we want to access page 3 and each page has a limit of 10documents.
    So we need to skip 2 pages (i.e. 20 documents) and access the document from 21-30*/

/* const page = req.query.page * 1 || 1; //default value is 1 and so reprsented by ||1
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    const documents = await Tour.countDocuments();
    if (req.query.page) {
      if (skip >= documents) {
        throw new Error('page not found');
      }
    }*/

/*const Features = new apiFeatures(Tour.find(), req.query)
    .filter() //we can do chaining to all just bcz we have returned an obj (return this)
    .sort()
    .limitFields()
    .paginate();
  //EXECUTE QUERY
  console.log('----', Features, '-----');
  const tour = await Features.TourFind;
  //RESPONSE SEND TO SERVER
  res.status(200).json({
    status: 'success',
    time: new Date().toISOString(),
    result: tour.length,
    data: {
      tour: tour,
    },
  });
});*/

/*exports.getATour = asyncError(async (req, res, next) => {
  const tour = await Tour.findById(req.params.ide).populate('reviews');
  /*using populate over here will run a query behind the scenes.therefore for tons of users,tons of  queires will affect the performance.
  this populate needs to be everywhere where we get the tours from db and display it on to the client
  And even logically,how else will we get the tour and user at the same time.We need to create a 
  new query to create a new coonection between them*/
/*findById  is the alternative way for
     Tours.findOne({_id:req.params.ide})  */
/*if (!tour) {
    //if(true) meaning (!false) meaning (!null)
    return next(new AppError('No tour find with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    time: new Date().toISOString(),
    data: {
      tour: tour,
    },
  });
});*/

/*exports.postATour = asyncError(async (req, res, next) => {
  const tour = await Tour.create(req.body);

  res.status(202).json({
    status: 'success',
    time: new Date().toISOString(),
    data: {
      tour: tour,
    },
  });*/
/* to post  a tour--way 1
      const newTour=new Tour({})
      newTour.save() 
      to post a tour--way2
      Tour.create()*/
/*});*/

/*exports.updateATour = asyncError(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.ide, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    //if(true) meaning (!false) meaning (!null)
    return next(new AppError('No tour find with that ID', 404));
  }
  res.status(203).json({
    status: 'success',
    time: new Date().toISOString(),
    data: {
      tour: tour,
    },
  });
});*/

/*exports.deleteATour = asyncError(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.ide);
  if (!tour) {
    //if(true) meaning (!false) meaning (!null)
    return next(new AppError('No tour find with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    time: new Date().toISOString(),
    data: {
      tour: null,
    },
  });
});*/

exports.getTourStats = asyncError(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, //adding 1 for each tour document
        numRatings: { $avg: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  if (!stats) {
    //if(true) meaning (!false) meaning (!null)
    return next(new AppError('No tour find with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });
});

exports.getMonthlyPlan = asyncError(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $limit: 12,
    },
  ]);
  if (!plan) {
    //if(true) meaning (!false) meaning (!null)
    return next(new AppError('No tour find with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      plan: plan,
    },
  });
});

//   /tours-within/:distance/center/:latlng/unit/:unit
//  /tours-within/distance/233/center/34.111745,-118.113491/unit/mi  --we are doing this
exports.getToursWithin = asyncError(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  //console.log(distance, latlng, unit);
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(new AppError('Please enter lat,lng ', 400));
  }
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, //radius needs to be radian.
  });
  //   /after adding geospatial query ,write the index for startLocation
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

//   /distances/:latlng/unit/:unit
exports.getDistance = asyncError(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(new AppError(' Please enter lat,lng ', 400));
  }
  const Multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    {
      //geoNear always needs to be the firt in all pipeline stages always
      $geoNear: {
        //Atleast one of our field should contain a geospatial index.
        //Over here its startlocation.Id there is only one geo spatial index,then geo Near uses it for measuring the distances.
        //if there are multiple indexes,then geoNear uses key parameter to define the field that we want to use.
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: Multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
