//-this file is used to get data from user interface and do the action according to it
import '@babel/polyfill';
import { doc } from 'prettier';
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';
import {displayMap } from './mapbox.js'
import {bookTour} from './stripe'

const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn=document.getElementById('book-tour')
const mapBox=document.getElementById('map') 

if(mapBox){
  const locations=JSON.parse(mapBox.dataset.locations)
  displayMap(locations)
} 
if (loginForm) {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault(); 
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;   
    login(email, password);
  });
} 
if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    /*we need to great  multipart form data .So instead of writing this -->
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;    we will create a multipart form data*/
  
    const form=new FormData()
    form.append('name',document.getElementById('name').value)
    form.append('email',document.getElementById('email').value)
    form.append('photo',document.getElementById('photo').files[0]) //files is an array & the first element of files is the photo

    console.log("form---",form)
    updateSettings(form,'data');  // form is an object of name & email.{name:name,email:email}
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'updating...';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { currentPassword, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn){
  //e.target means the element that is trigeered.Over here the button is triggered.
  //dataset.tourId means value of variable tourId i.e. data-tour-id=${tour.id}
  bookBtn.addEventListener('click',e=>{
    console.log("pressed")
    e.target.textContent='Processing'
    const tourId=e.target.dataset.tourId
    bookTour(tourId)
  })
}
