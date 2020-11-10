const dotenv = require('dotenv');

dotenv.config({ path: './config.env' }); //if this is written beloew mongoose and app then the mongoose
//and the app wont get any acceess.So its always imp to write env.config at the toppest as it can
const mongoose = require('mongoose');

//uncaught exception-in uncaught exception,crashing the app is must.
//this exception should be written at the top to listen to the error if it occurs.If it is written at the bottom
//bottom of the any error,then it wont listen to it
//uncaught execption have no relation with database.They operate synchornously.therefore no need of server
/*process.on('uncaughtException', (err) => {
  console.log('unhandled exception...shutting down..');
  console.log(err.name, err.message);
  process.exit(1);
});*/

const app = require('./mainapp.js');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('CONNECTED');
  //console.log(mongoose.connection);
});

//console.log(process.env);
const server = app.listen(3000, '127.0.0.1', () => {
  console.log('Entered into the port');
});

//in unhandled rejection ,crashing the app is not a good idea.so we shut down the applicatn gracefully
//Unhandled Rejections--like lossing connection with mongo db ddatabase due to loew server,wrong password,etc
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('unhandled rejection...shutting down..');
  server.close(() => {
    //shutting down the server first and then the application
    process.exit(1); //1 is for unhandled rejection and 0 is for success
  });
});
