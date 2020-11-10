const mongoose = require('mongoose');
const Tour = require('./tourModels.js');
const Schmea = mongoose.Schema;
const reviewSchema = new Schmea(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour:
      //parent referencing
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour'],
      },

    user:
      //parent referencing
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user'],
      },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//when a new review is created
reviewSchema.statics.calcAverageRating = async function (toudId) {
  const stats = await this.aggregate([
    //this in static is model
    {
      $match: { tour: toudId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(stats[0]._id, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(toudId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, //default
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.tour); //this is a current doc and  constructor in the model who created that doc
});

//when the review is updated or deleted
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne(); //const r= await.... then we will seee that r is an object.
  //this is a query obj and we add a object of r in it(add a property of r)
  console.log(this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRating(this.r.tour);
});

//preventing duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  /*this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  });*/

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
