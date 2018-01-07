'use strict';

const async = require("async");
const config = require(__base + '/server/config/config');
const {
  logger,
  response,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

module.exports.processNewCryptoHandler = (req) => {
  return new Promise((resolve, reject) => {

    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'processNewCryptoHandler'
    };

    logger.debug(fid,'invoked');

    validateRequiredAttributes(req)
    .then(addCryptoToDbIfNew)
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
      'type'
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

function addCryptoToDbIfNew(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'addCryptoToDbIfNew'
    };

    logger.debug(fid,'invoked');

    // Assuming Symbol is not a primary key. Thus, checking if exist before adding record.
    // Not performing check and insert in once query. Personal choice
    const checkIfExistQuery = {
      query: 'SELECT * FROM crypto_info WHERE symbol = ? LIMIT 1',
      post:[
        req.passData.payload.symbol
      ]
    };

    const insertQuery = {
      query: 'INSERT INTO crypto_info (symbol, name, type) VALUES (?, ?, ?)',
      post: [
        req.passData.payload.symbol,
        req.passData.payload.name,
        req.passData.payload.type
      ]
    };

    utilMysql.queryMysql(req, 'db_crypto', checkIfExistQuery.query, checkIfExistQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: null, defaultMessage:false } });
      } else {
        if (result.length > 0) {
          reject({error: { code: 103, message: `Crypto already exist in the system ${req.passData.payload.symbol}`, fid: fid, type: 'debug', trace: null, defaultMessage:false } });
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
