const express = require('express');
const authController = require('./../Controller/authController.js');
const usersController = require('./../Controller/usersController.js');
const app = express();
const {
  getAllUsers,
  postAUser,
  getAUser,
  updateAUser,
  deleteAUser,
} = require('../Controller/usersController.js');

const Router = express.Router();
app.use('/api/v1/users', Router);

Router.post('/signup', authController.signup);
Router.post('/login', authController.logIn);
Router.get('/logout', authController.logout);
Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

Router.use(authController.protect);
//all the below routes are now protected

Router.patch('/updateMyPassword', authController.updatePassword);
Router.get('/me', usersController.getMe, getAUser);
Router.patch('/updateMe', usersController.uploadUserPhoto,usersController.resizeUserPhoto,usersController.updateMe);
Router.delete('/deleteMe', usersController.deleteMe);

Router.use(authController.restrictTo('admin'));

Router.route('/').get(getAllUsers).post(postAUser);
Router.route('/:ide').get(getAUser).patch(updateAUser).delete(deleteAUser);
module.exports = Router;
