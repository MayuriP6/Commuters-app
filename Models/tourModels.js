const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./../Models/userModel.js');
const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have length less than equal to 40'],
      minlength: [10, 'A tour must have length more than equal to 10'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty level '],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'diificulty level should be easy/medium/difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [3, 'rating should be greater than 3'],
      max: [5, 'rating should be less than 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to the current doc on the NEW doc creation.It does not work for any update type queries also.
          return val < this.price;
        },
        message: 'Discount price {VALUE} should be below regular price', //if the validator turns false
      },
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary '],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, //name of the image which we can read later
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], //an array of strings
    createdAt: {
      //it is a timestamp set by the time when user adds a new tour
      type: Date,
      default: Date.now(),
      select: false, //to hide createdAt at the output
    },
    startDates: [Date], //dates at which tour starts
    startLocation: {
      //this object is not for schmea type this time.It is an embedded object
      //using GeoJSON for geospatial data--The geospatial data should have type and co-ordinates in order to recongize it as  GeoJSON object
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      //array indicates that we are creating a document and embbeding it into another document.
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      //though it is an array,we are giving the reference abt the child overe here.So its a child ref
      //tours and users will always remain seperate inthe database.When the guide is shown up,it wont shown the user,but will only show its ID
      {
        type: mongoose.Schema.ObjectId, //it means that we accept the type to be monogoId
        ref: 'User', //we dont need to import the User.can write directly
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//indexing
//toursSchema.index({price:1}) --simple indexing
toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' }); //sphere of earth

//DOCUMENT MIDDLEWARE-runs before .save() and .create()
toursSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/*toursSchema.pre('save', function (next) {
  console.log('Will save documents');
  next();
});
toursSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});*/

//modelling the tour guides into tour using embbedding
/*toursSchema.pre('save', async function (next) {
  const guidespromise = this.guides.map(async (id) => await User.findById(id)); //the map method will assign the result of each iteration to an array.
  //and the async funtion will return a promise too.so basically guidespromise will be an array of promises
  this.guides = await Promise.all(guidespromise);
  next();
});*/

//QUERY MIDDLEWARE
toursSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //this is a query obj
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

/*toursSchema.post(/^find/,  function (docs, next) {
  console.log(docs);
  next();
});*/

//AAGREGATE MIDDLEWARE
/*toursSchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { secretTour: { $ne: false } } });
});*/

toursSchema.virtual('Weekduration').get(function () {
  const week = (this.duration / 7).toFixed(2);
  return week;
});

//virtual populate
//A tour will have reviews inside it by virtual property. (tours with reviews in it wont be saved into databasse only the tours will be saved)
toursSchema.virtual('reviews', {
  ref: 'Review', // The name of model
  foreignField: 'tour', //name of the field in other model that refers to this model
  localField: '_id', //where the id  in tour feild is stored in the current Tour model
});

const Tour = mongoose.model('Tour', toursSchema);
module.exports = Tour;
