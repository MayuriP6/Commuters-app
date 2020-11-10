import axios from 'axios';
import asyncError from '../../utils/asyncError.js';
import { showAlert } from './alert.js';
export const login = async (email, password) => {
  try {
    const res = await axios({
      //if there is an error like wrong password/email,then axios send the error back .Hence using it
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email: email, //in postman we wrote email & password in login
        password: password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = asyncError(async (req, res) => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) {
      location.reload(true); //the new jwt cookie will be send to the server after the browser realoads and then when the servver
      // finds the new cookie mistmatching ,it will logout. 
      //true means that it will reload the page from server and not from browser
    }                       
  } catch (err) {
    showAlert('error', 'Try to logout after some time');
  }
});
