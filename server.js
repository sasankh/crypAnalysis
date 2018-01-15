/* global global */
'use strict';

global.__base = __dirname;

const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cuid = require('cuid');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const compression = require('compression');
const log4js = require('log4js');

const config = require(`${__base}/server/config/config`);

// express instance
const app = express();

if(config.app.environment === 'prod' || config.app.environment === 'stage' || config.app.environment === 'dev') {
  app.set('port', 80);
} else {
  app.set('port', config.app.port);
}

// request id initializer for logger
const requestID = (req, res, next) => {
  req.requestId = cuid();
  req.passData = {};
  next();
};

// middlewares
app.use(morgan('dev'));
app.use(bodyParser.json()); // parses application/json
app.use(bodyParser.urlencoded({ extended: true })); // parses application/x-www-form-urlencoded
app.use(compression()); // compression middleware
app.use(methodOverride());  // HTTP verbs like PUT or DELETE
app.use(requestID); // request id for logger
app.use(helmet()); // implements 6 measures for security headers
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

//app.set('trust proxy', 1);

// routes
require('./server/routes/index')(app);

//initialize
require(`${__base}/server/init/logger`);
require(`${__base}/server/init/mysql`);
//require(`${__base}/server/init/nedb`);  //not used
require(`${__base}/server/init/limiter`);

// start listening
const server = app.listen(app.get('port'), () => {
   const logger = require(`${__base}/server/init/logger`).main;

   logger.info(`[INITIALIZATION]: server.js --> Server started at port: ${app.get('port')}`);
});

server.timeout = parseInt(config.app.timeout);

module.exports = server;
