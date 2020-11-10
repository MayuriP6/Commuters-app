const AppError = require('./../utils/appError.js');
const asyncError = require('./../utils/asyncError.js');
const apiFeatures = require('../utils/apiFeatures.js');

exports.getAll = (Model) =>
  asyncError(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const Features = new apiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    console.log('----', Features, '-----');

    //another way for indexing of explain does not work-features.query.setOptions({ explain: 'executionStats' })
    const doc = await Features.TourFind;
    res.status(200).json({
      status: 'success',
      time: new Date().toISOString(),
      result: doc.length,
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  asyncError(async (req, res, next) => {
    if (popOptions) {
      var query = await Model.findById(req.params.ide).populate(popOptions);
    } else {
      var query = await Model.findById(req.params.ide);
    }

    const doc = await query;
    if (!doc) {
      return next(new AppError('No document find with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      time: new Date().toISOString(),
      data: {
        tour: doc,
      },
    })
  });

exports.createOne = (Model) =>
  asyncError(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(202).json({
      status: 'success',
      time: new Date().toISOString(),
      data: {
        data: doc,
      },
    });
  });

exports.updateOne = (Model) =>
  asyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.ide, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      //if(true) meaning (!false) meaning (!null)
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(203).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  asyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.ide);
    if (!doc) {
      return next(new AppError('No document find with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
