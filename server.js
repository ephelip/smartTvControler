'use strict'

// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

// Allow all requests from all domains & localhost
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

// MiddleWares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

let currentChannelIndex = 0;

// Setup
var PORT = process.env.HB_SERVER_PORT || 6060;

// Routes
const routes = require('./routes');

//  Connect all our routes to our application
app.use('/', routes);

// Server start
app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Express server listening on port ${PORT}`);
  }
});
