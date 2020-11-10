module.exports = (fn) => {
  return (req, res, next) => {
    //this is the fn that express is going to call
    fn(req, res, next).catch((err) => next(err));
  };
};
