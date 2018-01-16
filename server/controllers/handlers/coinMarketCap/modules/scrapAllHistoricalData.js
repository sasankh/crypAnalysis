'use strict';

const asyncLib = require("async");

const config = require(__base + '/server/config/config');

const {
  logger,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);

const scrapIndividualHistoricalData = require(`${__base}/server/controllers/handlers/coinMarketCap/modules/scrapIndividualHistoricalData`);

/*
//Required payload
req{
  requestId,
  passData: {
    handler
  }
};
*/
module.exports = (req) => {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'scrapAllHistoricalData'
    };

    logger.debug(fid,'invoked');

    getAllCryptoIdWithValidDataSource(req)
    .then(initiateIndividualHistoricalDataScrapping)
    .then(responseBody)
    .then((data) => {
      resolve(data);
    })
    .catch((err) => {
      reject(err);
    });

  });
};

function getAllCryptoIdWithValidDataSource(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getAllCryptoIdWithValidDataSource'
    };

    logger.debug(fid,'invoked');

    const getFields = [
      'cds.crypto_id',
      'ci.name',
      'ci.symbol'
    ];

    const getAllCryptoQuery = {
      query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ci.crypto_id IS NOT NULL AND cds.crypto_id IS NOT NULL AND cds.data_url IS NOT NULL AND ci.source = cds.platform AND cds.attention = ? AND cds.platform = ?`,
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
          req.passData.cryptoList = result;
          resolve(req);
        } else {
          reject({error: { code: 103, message: `No crypto with valid Data source ${configCoinMarketCap.source}`, fid: fid, type: 'debug', trace: result, defaultMessage:false } });
        }
      }
    });

  });
}

function initiateIndividualHistoricalDataScrapping(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'initiateIndividualHistoricalDataScrapping'
    };

    logger.debug(fid,'invoked');

    asyncLib.map(req.passData.cryptoList, (crypto, callback) => {
      const miniReq = {
        requestId: `${fid.requestId}-${crypto.crypto_id}`,
        passData: {
          handler: req.passData.handler,
          crypto_id: crypto.crypto_id
        }
      };

      const response = {
        crypto_id: crypto.crypto_id,
        name: crypto.name,
        symbol: crypto.symbol,
        error: true
      }

      scrapIndividualHistoricalData(miniReq)
      .then((data) => {
        response.error = false;
        callback(null, response);
      })
      .catch((err) => {
        logger.log_reject(miniReq, err);
        response.message = (err && err.message ? err.message : 'Unknown Error. Check Logs')
        callback(null, response);
      })

    }, (err, result) => {
      req.passData.result = result;
      resolve(req);
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
      crypto_processed: req.passData.cryptoList.length,
      result: req.passData.result
    };

    resolve(responseBody);
  });
}
