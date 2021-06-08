const express = require('express');
const morgan = require('morgan');
const redis = require('redis'); //for using the redis client and server
const { connectToDB } = require('./lib/mongo');


//Two environment variables, PORT and HOST which allow us to communicate with Redis.
const api = require('./api'); //hook to endpoints written in the api folder
const { rateLimit } = require('./lib/redis');


const app = express(); //using the express framework
const port = process.env.PORT || 8000; //port 8K/localhost

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

connectToDB(() => {
    app.listen(port, () => {
        console.log("== Server is listening on port:", port);
    });
});