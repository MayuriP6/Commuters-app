const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const hpp = require('hpp');
const app = express();
const cookieParser = require('cookie-parser');
const csp = require('express-csp');
const tourRouter = require('./Routes/toursRoute.js');
const userRouter = require('./Routes/usersRoute.js');
const reviewRouter = require('./Routes/reviewRoute.js');
const viewRouter = require('./Routes/viewRoute.js');
const AppError = require('./utils/appError.js');
const errorController = require('./Controller/errorController.js');
const bookingsRouter=require('./Routes/bookingsRoute.js')
const { urlencoded } = require('express');

//middlewares
//app.use(morgan('dev'));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
/// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//SET SECURITY HTTP HEADERS -->this middleware should be at the top as much as it can
app.use(helmet());
csp.extend(app, {
    policy: {
        directives: {
            'default-src': ['self'],
            'style-src': ['self', 'unsafe-inline', 'https:'],
            'font-src': ['self', 'https://fonts.gstatic.com'],
            'script-src': [
                'self',
                'unsafe-inline',
                'data',
                'blob',
                'https://js.stripe.com',
                'https://api.mapbox.com',
            ],
            'worker-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'https://js.stripe.com',
                'https://api.mapbox.com',
            ],
            'frame-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'https://js.stripe.com',
                'https://api.mapbox.com',
            ],
            'img-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'https://js.stripe.com',
                'https://api.mapbox.com',
            ],
            'connect-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'https://api.mapbox.com',
                'https://events.mapbox.com',
            ],
        },
    },
});
//Test middleware
app.use((req, res, next) => {
  console.log('*** Hello from middleware ***');
  next();
});

//Limit requests from same API
const rateLimitCount = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // setting the rate limit for 1 hr
  message: 'Too many requests from this IP.Please try after an hour ',
  header: true,
});
app.use('/api', rateLimitCount);

//Body parser--reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //this middleware for posting should be written over here bcz if its written
//in tours controller,then it means thatwe are using this middleware after routing has been done in toursRoute.js
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // the way the form send data to the server is urlencoded
app.use(cookieParser()); //parses the data from cookies

//Data sanitization against NOSQL query injection
app.use(mongoSanitize()); //filters the $ and . from re.body,req.parms,req.query

//Data sanitization against XSS (cross scriptingside attack)
app.use(xss()); //if the attacker inserts html with js then it replaces the html symbols

//prevents parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

//route middleware
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings',bookingsRouter)

//handling unhandled routes through a middleware fn
app.all('*', (req, res, next) => {
  /* const err = new Error(`Can't find  ${req.originalUrl} on this server `);
  err.status = 'fail';
  err.statusCode = 404;
  next(err); //express assumes that whatever we pass in next is an error (valid for all) and then it will skip
  // all the middlewares in middlware s tack and send the error to the global handling middleware
  //if we pass this middlware to other middleware with error,then too it will work the same
  //but here just after this middleware we have global error handling middleware*/
  next(new AppError(`Can't find  ${req.originalUrl} on this server `));
});

//global error handling middleware
app.use(errorController);
module.exports = app;
