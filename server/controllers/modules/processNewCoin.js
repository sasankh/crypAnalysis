'use strict';

const async = require("async");
const uuidv5 = require('uuid/v5');

const config = require(__base + '/server/config/config');
const {
  logger,
  response,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const {
  cryptoNameErrorChecker
} = require(`${__base}/server/controllers/utilities/findErrorHelpers`);

module.exports.processNewCoinHandler = (req) => {
  return new Promise((resolve, reject) => {

    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'processNewCoinHandler'
    };

    logger.debug(fid,'invoked');

    validateRequiredAttributes(req)
    .then(addCoinToDbIfNew)
    .then(responseBody)
    .then((data) => {
      resolve(data);
    })
    .catch((err) => {
      reject(err);
    });
  });
};

function validateRequiredAttributes(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'validateRequiredAttributes'
    };

    logger.debug(fid,'invoked');

    const requiredAttributes = [
      'name',
      'symbol',
      'type',
      'source'
    ];

    const payloadAttributes = Object.keys(req.passData.payload);

    async.map(requiredAttributes, (attribute, callback) => {
      if (payloadAttributes.indexOf(attribute) > -1) {
        switch (attribute) {
          default:
            callback(null, true);
        }
      } else {
        callback(`Missing required attribute: ${attribute}`);
      }
    }, (err, result) => {
      if (err) {
        reject({error: { code: 103, message: err, fid: fid, type: 'debug', trace: null, defaultMessage:false } });
      } else {
        resolve(req);
      }
    });

  });
}

function addCoinToDbIfNew(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'addCoinToDbIfNew'
    };

    logger.debug(fid,'invoked');

    const uuidNameSpace = uuidv5(`${req.passData.payload.symbol}-${req.passData.payload.name}-${req.passData.payload.type}-${req.passData.payload.source}`, uuidv5.URL);
    const crypto_id = uuidv5(req.passData.payload.symbol, uuidNameSpace);

    const checkIfExistQuery = {
      query: 'SELECT * FROM crypto_info WHERE symbol = ? AND crypto_id = ? AND source = ? LIMIT 1',
      post:[
        req.passData.payload.symbol,
        crypto_id,
        req.passData.payload.source
      ]
    };

    const insertQuery = {
      query: 'INSERT INTO crypto_info (crypto_id, symbol, name, type, attention, source) VALUES (?, ?, ?, ?, ?, ?)',
      post: [
        crypto_id,
        req.passData.payload.symbol,
        req.passData.payload.name,
        req.passData.payload.type,
        (cryptoNameErrorChecker(req, req.passData.payload.symbol, req.passData.payload.name) ? 1 : 0),
        req.passData.payload.source
      ]
    };

    utilMysql.queryMysql(req, 'db_crypto', checkIfExistQuery.query, checkIfExistQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: null, defaultMessage:false } });
      } else {
        if (result.length > 0) {
          reject({error: { code: 103, message: `Coin already exist in the system ${req.passData.payload.symbol}`, fid: fid, type: 'debug', trace: null, defaultMessage:false } });
        } else {

          utilMysql.queryMysql(req, 'db_crypto', insertQuery.query, insertQuery.post, (err, result) => {
            if (err) {
              reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: null, defaultMessage:false } });
            } else {
              resolve(req);
            }
          });

        }
      }
    });

  });
}

function responseBody(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'responseBody'
    };

    logger.debug(fid,'invoked');

    const responseBody = {
      symbol: req.passData.payload.symbol,
      name: req.passData.payload.name,
      type: req.passData.payload.type,
      added: true
    };

    resolve(responseBody);
  });
}
