'use strict';

var urlExists = require('url-exists');

const logger = require(__base + '/server/utilities/modules/logger');

module.exports.checkIfJsonRequest = (req) => {

  return new Promise( (resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'checkIfJsonRequest'
    };

    logger.debug(fid,'invoked');

    if(req.is('application/json') === false) {
      reject({ error: { code: 103, message: 'Incoming request (Content-Type) is not application/json.', fid: fid, type: 'warn', trace: null }});
    } else {
      try {
        resolve(req);
      } catch(e) {
        reject({ error: { code: 103, message: 'Content (content-body) is not JSON type.', fid: fid, type: 'warn', trace: null }});
      }

    }

  });
};

module.exports.checkIfMultipartFormDataRequest = (req) => {

  return new Promise( (resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'checkIfMultipartFormDataRequest'
    };

    logger.debug(fid,'invoked');

    if(req.is('multipart/form-data') === false) {
      reject({ error: { code: 103, message: 'Incoming request (Content-Type) is not multipart/form-data.', fid: fid, type: 'debug', trace: null }});
    } else {
      if(req.body){
        try {
          resolve(req);
        } catch(e) {
          reject({ error: { code: 103, message: 'Content-Type is multipart/form-data but the supplied content (content-body) is not JSON type.', fid: fid, type: 'debug', trace: null }});
        }
      } else {
        resolve(req);
      }
    }
  });

};

module.exports.isJSON = (object) => {
  try {
    const parsedObject = JSON.parse(object);
    return true;
  } catch (e) {
    if (typeof object === 'object' && object.constructor === Object && typeof object.constructor === 'function') {
      return true;
    } else {
      return false;
    }
  }
};

module.exports.isArray = (data) => {
  if (typeof data === 'object' && data.constructor === 'Array') {
    return true;
  } else {
    return false;
  }
};

module.exports.getJSON = (body) => {
  try {
    const parsedObject = JSON.parse(body);
    return parsedObject;
  } catch (e) {
    if (typeof object === 'object' && object.constructor === Object && typeof object.constructor === 'function') {
      return body;
    } else {
      return false;
    }
  }
};

module.exports.checkUrlExists = (url) => {
  return new Promise( (resolve, reject) => {
    try {
      urlExists(url, (err, exists) => {
        if (err) {
          resolve(false);
        } else {
          resolve(exists);
        }
      });
    } catch (e) {
      resolve(false);
    }
  })
};
