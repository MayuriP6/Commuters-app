const AppError = require('../utils/appError.js');

const handleCastErrordb = (err) => {
  const message = `invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};
const handleDublicateFielddb = (err) => {
  const errors = err.keyValue.name;
  const message = `Duplicate Field value ${errors} .Please use another  value`;
  return new AppError(message, 400);
};
const handleValidationErrordb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data.${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJsonWebTokenError = () => {
  return new AppError('Invalid token .Please login again', 401);
};
const handleTokenExpire = () => {
  return new AppError('Your token has been expired.Please login again', 401);
};
const sendErrorDev = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  //B) RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    //we trust the operational error and hence display the proper message even in production to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('ERROR', err);
    //programming or other unknown error which we dont want to leak
    return res.status(500).json({
      status: 'Error',
      message: 'something went wrong',
    });
  }
  //B)RENDERED Website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  console.error('ERROR', err);
  return res.status(500).json({
    status: 'Error',
    message: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  //err is error in postman
  console.log(err.stack);
  err.statusCode = err.statusCode || 500; //500 is default
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let errorvar = { ...err };
    errorvar.message = err.message;
    console.log('errorvar---', errorvar);
    console.log('err----', err);

    //if id is not in the format of mongodb id --casterrors
    if (err.stack.startsWith('CastError')) {
      errorvar = handleCastErrordb(errorvar);
    }
    //mongo errors
    if (err.code === 11000) {
      errorvar = handleDublicateFielddb(errorvar);
    }
    //validation errors
    if (err.stack.startsWith('ValidationError')) {
      errorvar = handleValidationErrordb(errorvar);
    }
    //when the token does not match for any id
    if (err.name === 'JsonWebTokenError') {
      errorvar = handleJsonWebTokenError();
    }
    //when the token expires
    if (err.name === 'TokenExpiredError') {
      errorvar = handleTokenExpire();
    }
    sendErrorProd(errorvar, req, res);
  }
};
