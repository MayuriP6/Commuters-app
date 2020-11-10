const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const bcrptjs = require('bcryptjs');
const AppError = require('./../utils/appError.js');
const User = require('./../Models/userModel.js');
const asyncError = require('./../utils/asyncError.js');
const Email = require('./../utils/email.js');

const jwtsign = (Id) => {
  return jwt.sign({ id: Id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = jwtsign(user._id);

  //sending jwt via cookie
  const cookieoption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, //accessible by only the web server.The browser will get the cookie,stored it
    //and send back for the request to the server.But cant edit it.Not even destroy or delete
  };
  if (process.env.NODE_ENV === 'production') {
    Object.assign(cookieoption, { secure: true }); //secure:true means that cokkie needs to be used with https only
  }
  user.password = undefined;
  res.cookie('jwt', token, cookieoption);
  res.status(statusCode).json({
    status: 'success',
    token, //token:token
    data: {
      user: user,
    },
  });
};

exports.signup = asyncError( async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    email: req.body.email,
  });
  const url=`${req.protocol}://${req.get('host')}/me`
  console.log(url)
  createSendToken(newUser, 201, res);
  await new Email(newUser,url).sendWelcome()
});

exports.logIn = asyncError(async (req, res, next) => {
  const { email, password } = req.body; //email=req.body.email and password=req.body.password

  //1)check if email and password are entered
  if (!email || !password) {
    return next(new AppError('enter the email and password', 400));
  }

  //2)check if user of that particular mail  exist
  const user = await User.findOne({ email: email }).select('+password'); //checking the email and selecting password from db so as to verify it later
  if (user) {
    console.log('verify');
    var checkpassword = await user.correctPassword(password, user.password); //checking the passwords
  }
  if (!user || !checkpassword) {
    return next(new AppError('Email or Password is incorrect'));
  }
  //3)send the token to the client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = asyncError(async (req, res, next) => {
  let token;
  //1)get the token and check if its there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }
  //2)verify the token --in this we check if someone manipulated the data( especially the id that we get though payload) or the token expired
  //util.promisify converts the callback based fn in to promise based function which returns a promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)check if user exists --if the user is deleted after someone has got the token of that user
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User not found for the given token', 401));
  }

  //4)check if user modified the password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed the password.Please login again', 401)
    );
  }
  console.log(currentUser);
  //Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//only for rendered pages ,no errors
exports.isLoggedIn = async (req, res, next) => {
  //1)get the token and check if its there
  if (req.cookies.jwt) {
    try {
      //2)verify the token --in this we check if someone manipulated the data( especially the id that we get though payload) or the token expired
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3)check if user exists --if the user is deleted but somone has got the token of that user
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //4)check if user modified the password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //there is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      //there is no logged in user
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  //this roles will now be an array of 'admin' and 'lead-guide'
  return asyncError(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have the permission to perform this action',
          403
        )
      );
    }
    next();
  });
};

exports.forgotPassword = asyncError(async (req, res, next) => {
  //1)Get the user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with this mail id', 404));
  }
  //2)Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //we need to save the passwordResetExpire and passwordResetToken which have been updated

  //3) send it to users mail
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
/*const message = `forgot your password.Submit a patch request with a 
  new password and password Confirm to ${resetURL}.\nIf you didnt then please ignore this mail`;*/
  try {
    /*await Email({
      email: user.email,
      text: message,
      subject: 'This link is only valid for 10 min',*/
      await new Email(user,resetURL).sendPasswordReset()
    
    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    console.log(err);
    (user.passwordResetToken = undefined), //we can access this over user bcz above on line 120,we have saved this schema aftet randomtoken was created
      (user.passwordResetExpirse = undefined);
    await user.save({ validateBeforeSave: false });

    return next(new AppError('there was error sending the email', 500));
  }
});

exports.resetPassword = asyncError(async (req, res, next) => {
  //1GET USER BASED ON THE TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpirse: { $gt: Date.now() },
  }); //Date.now() will convert in to proper time stamp at the backend

  //2)IF THE TOKEN IS NOT EXPIRED AND THERE IS A USER FOR THE TOKEN,THEN RESET THE PASSWORD
  if (!user) {
    return next(
      new AppError('The token is not found or the token is expired', 400)
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpirse = undefined;
  //await user.save()

  //3)UPDATE changepasswordAt property for the user
  /*user.passwordChangedAt = Date.now()-1000; //instead of this we can even write a middleware fn in usermodel*/
  await user.save();

  //4)LOG THE USER AND SEND THE JWT TOKEN TO THE CLIENT
  createSendToken(user, 200, res);
});

exports.updatePassword = asyncError(async (req, res, next) => {
  /*If the user who is accessing the protected data wish to update the password  then he need to  enter the old password
   again to along with the new password .We ask the user to enter the old password bcz it can happen someone else is trying to change his password from his account*/

  //1)GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('No user found', 401));
  }
  //2)CHECK IF POSTED CURRENT PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('entered password is incorrect', 401));
  }
  //3)IF SO UPDATE THE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  //4)LOG USER IN WITH THE UPDATED PASSSWORD AND THE JWT
  createSendToken(user, 200, res);
});
