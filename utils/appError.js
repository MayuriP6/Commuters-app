class AppError extends Error {
  constructor(message, statusCode) {
    //setting the message property to incoming msg
    super(message); //calling the parent constructor  //parent class has only the msg property in general also
    console.log(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    console.log(this.statusCode);
    console.log(this.status);
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
