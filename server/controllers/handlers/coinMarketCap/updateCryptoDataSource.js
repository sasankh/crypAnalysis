'use strict';

const async = require("async");

const config = require(__base + '/server/config/config');

const {
  logger,
  response,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);

module.exports = (req, res) => {
  logger.request('updateCryptoDataSource',req);
  req.passData.handler = 'updateCryptoDataSource';

  getAllCryptoList(req)
  .then(getAllCryptoList)
  .then(responseBody)
  .then((data) => {
    response.success(req, data, res);
  })
  .catch((err) => {
    response.failure(req, err, res);
  });
};

function getAllCryptoList(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getAllCryptoList'
    };

    logger.debug(fid,'invoked');

    const getFields = [
      'symbol',
      'name',
      'type',
    ];

    const getAllCryptoQuery = {
      query: `SELECT ${getFields.join(', ')} FROM crypto_info WHERE attention = ? AND source = ?`,
      post: [
        0,
        configCoinMarketCap.source
      ]
    };

    utilMysql.queryMysql(req, 'db_crypto', getAllCryptoQuery.query, getAllCryptoQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        if (result.length > 0) {
          console.log(result);
          req.passData.cryptoList = result;
          resolve(req);
        } else {
          reject({error: { code: 103, message: `No crypto from ${configCoinMarketCap.source}`, fid: fid, type: 'debug', trace: result, defaultMessage:false } });
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
      cryptoList: req.passData.cryptoList
    };

    resolve(responseBody);
  });
}
