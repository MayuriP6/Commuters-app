const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const schema = mongoose.Schema;

const userSchema = new schema({
  name: {
    type: String,
    required: [true, 'please enter your name'],
    //unique:true,
    trim: true,
    //maxlength:[25,"name should have maximum 25 characters"],
    //minlength:[5,"name should have minimum 5 characters"]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //notselecting the password field when the data is retrieved from database i.e.hiding the data when data is retieved
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password'], //require mean reqquired as input..not necessary that it should be saved in database
    minlength: 8,
    validate: {
      //this only works on CREATE and SAVE and not on UPDATE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Both passwords should be same',
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date, //user who change their password will have this field.rest wont
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },

  photo: {
    type: String,
    default:'default.jpg'
  },
  passwordResetToken: String,
  passwordResetExpirse: Date,
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid mail id'],
    unique: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
//to update the property of passwordChangedAt property in db
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // /^find/ indicates find,findById,findByIdandUpdate ,etc i.e to all the queires that start with find
  this.find({ active: { $ne: false } });
  next();
});

//instance method for password matching-this method is available to all the documents that import this file
userSchema.methods.correctPassword = async function (
  enteredpassword,
  storedpassword
) {
  return await bcrypt.compare(enteredpassword, storedpassword);
};

//instance method for change password
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp; ///returns true if password is changed after a new  token is issued
  }

  // seeting the default value as false for the  user who has not changed the password after getting the token
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  //storing the encrypted form(in hex) of resetToken in the database and passing the resetToken(not encrypted ) to the user via email
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpirse = Date.now() + 10 * 60 * 1000; //10 min converted into millisec
  console.log(this.passwordResetExpirse, this.passwordResetToken);
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
