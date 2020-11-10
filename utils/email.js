const nodemailer = require('nodemailer');
const pug=require('pug')
const {htmlToText}=require('html-to-text')
const { options } = require('../mainapp');
const { getMaxListeners, model } = require('../Models/userModel');

//new Email(user,url).sendWelcome()
module.exports= class Email{
  constructor(user,url){  //the constructor will run whenever a new obj is created from this class
    this.to=user.email,
    this.firstName=user.name.split(" ")[0],
    this.url=url,
    this.from=`natours.io <${process.env.EMAIL_FROM}>` 
  }

  newTransport(){
    if (process.env.NODE_ENV==='production'){
      //sendgrid
      return (nodemailer.createTransport({
        service:'SendGrid',
        auth:{
          user:process.env.SENDGRID_USERNAME,
          pass:process.env.SENDGRID_PASSWORD
        }
      }))
    }
    return nodemailer.createTransport({
      //1)CREATE A TRANSPORTER-service like gmail that will send the mail
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }


  async send(template,subject){
    //send the actual mail
    //1)render the html based on pug template
    const html=pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
       firstName:this.firstName,
       url:this.url,
       subject
    })
    //2)define email options
    const mailoptions = {
      to: this.to,
      from: this.from,
      subject,
      text: htmlToText(html),
      html
    };

    //3)create a transport & send the email
    await this.newTransport().sendMail(mailoptions)
  }
  async sendWelcome(){
    await this.send('welcome','Welcome to the commuters family')
  }
  async sendPasswordReset(){
    await this.send('passwordReset','Your password Reset token(valid for only 10 mins)')
  }
}


//sending mail using nodemailer (for dev purpose in postman)
/*
const sendEmail = async (option) => {
  const transporter = nodemailer.createTransport({
    //1)CREATE A TRANSPORTER-service like gmail that will send the mail
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2)DEFINE THE MAIL OPTIONS
  const mailoptions = {
    to: option.email,
    from: 'natours.io',
    subject: option.subject,
    text: option.text,
  };
  //3)ACTUALLY SEND THE MAIL
  await transporter.sendMail(mailoptions);
};
module.exports = sendEmail;*/
