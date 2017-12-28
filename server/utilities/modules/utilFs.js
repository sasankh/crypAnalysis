'use strict';

const fs = require('fs');
const fse = require('fs-extra');

const logger = require(__base + '/server/utilities/modules/logger');

/**
* deleteFileNoCallback
* The function makes an attemp to delete the file in the supplied path. There is no callback
* @api public
**/
module.exports.deleteFileNoCallback = (req, path) => {

  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'deleteFileNoCallback'
  };

  logger.debug(fid,path);

  fs.unlink(path, function(err) {
    if (err && err.code !== 'ENOENT') {
      logger.warn(fid, 'Problem deleting file', err);
    }
  });

};

/**
* deleteDirectoryNoCallback
* The function makes an attemp to delete the directory in the supplied path. There is no callback
* @api public
**/
module.exports.deleteDirectoryNoCallback = (req, path) => {

  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'deleteDirectoryNoCallback'
  };

  logger.debug(fid, path);

  fse.remove(path, function (err) {
    if (err && err.code !== 'ENOENT') {
      logger.warn(fid, 'Problem trying to remove directory', err);
    }
  });
};


/**
* readFile
* the function reads the respective file
* @api public
**/
module.exports.readFile = (req, path, callback) => {

  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'readFile'
  };

  logger.debug(fid,path);

  fs.readFile(path, 'utf8',  function(err,data) {
    if (err) {
      logger.warn(fid, 'Problem reading file', err);
      callback(err, null);
    }else{
      callback(null, data);
    }
  });

};

/**
* deleteFile
* The function deletes file from the supplied location
* @api public
**/
module.exports.deleteFile = (req, path, callback) => {

  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'deleteFile'
  };

  logger.debug(fid,path);

  fs.unlink(path, function(err) {
    if (err && err.code !== 'ENOENT') {
      logger.warn(fid, 'Problem deleting file', err);
      callback(err, null);
    }else{
      callback(null, true);
    }
  });

};
