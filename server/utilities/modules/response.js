'use strict';

const fse = require('fs-extra');

const logger = require(__base + '/server/utilities/modules/logger');

function process(req, res, body, response) {
  response(res, {
    error: {
      code: body.error.code,
      message: body.error.message
    }
  },
  body.error.defaultMessage);
}

function unAuthorize(response, error, defaultMessage) {
  if(defaultMessage){
    error.error.message = 'Credentials did not match.';
  }
  response.status(403).send(error);
}

function badRequest(response, error, defaultMessage) {
  if(defaultMessage){
    error.error.message = 'Invalid request or Missing parameters or Invalid parameters value.';
  }
  response.status(400).send(error);
}

function notFound(response, error, defaultMessage) {
  if(defaultMessage){
    error.error.message = 'Requested Resource Not Found.';
  }
  response.status(404).send(error);
}

function internalError(response, error, defaultMessage) {
  if(defaultMessage){
    error.error.message = 'Sorry! something went wrong with the request.';
  }
  response.status(400).send(error);
}

function noContent(response) {
  response.status(204).send(null);
}

function okProxyResponse(response, error) {
  response.status(200).send(error.error.message);
}

function caughtError(response, error) {
  error = {
    error: {
      code: 103,
      message: 'Unable to process request.'
    }
  };

  response.status(400).send(error);
}

module.exports.success = (request, body, response) =>{

  response.set('Content-Type', 'application/json');

  response.status(200).send(body);

};

module.exports.download = (request, body, response) => {
  response.set('Content-Type', body.content_type);
  response.attachment(body.name);
  response.status(200);
  response.download(body.path, function(err){
  if (err) {
    response.status(400).send('Unable to complete download');
  } else {
    fse.remove(body.path, function (err) {
      if (err){
        logger.warn(null,'Error trying to delete the zip file '+body.name+'.');
      }
    });
  }
});

};

module.exports.failure = (request, body, response) => {

  response.set('Content-Type', 'application/json');

  if(body.error) {
    logger.log_manager(body.error);
    switch(body.error.code) {
      case 101:
        process(request, response, body, unAuthorize);
        break;
      case 102:
        process(request, response, body, internalError);
        break;
      case 103:
        process(request, response, body, badRequest);
        break;
      case 104:
        process(request, response, body, notFound);
        break;
      case 105:
        process(request, response, body, noContent);
        break;
      case 110:
        process(request, response, body, okProxyResponse);
        break;
      default:
        process(request, response, body, badRequest);

    }
  } else {
    // other internally caught errors

    const fid = {
      requestId: request.requestId,
      handler: request.passData.handler,
      functionName: 'Exception'
    };

    const new_body = { error: { code: 102, message: 'Problem processing', fid: fid, type: 'error', trace: {
      body,
      message: body.message,
      stack: body.stack
    }}};

    logger.log_manager(new_body.error);
    process(request, response, new_body, caughtError);
  }
};
