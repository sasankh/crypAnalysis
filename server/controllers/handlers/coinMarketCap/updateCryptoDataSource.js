'use strict';

const asyncLib = require("async");

const config = require(__base + '/server/config/config');

const {
  logger,
  response,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);
const coin_market_cap_limiter = require(__base + '/server/init/limiter').coin_market_cap_limiter;

const {
  getPlatformCryptoSymbol
} = require(`${__base}/server/controllers/handlers/coinMarketCap/utils/helpers`);

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
      functionName: 'updateCryptoDataSource'
    };

    logger.debug(fid,'invoked');

    getAllCryptoList(req)
    .then(getAllCryptoList)
    .then(processCryptoUrl)
    .then(responseBody)
    .then((data) => {
      resolve(data);
    })
    .catch((err) => {
      reject(err);
    });

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
      'ci.name',
      'ci.symbol',
      'ci.type',
      'ci.crypto_id',
      'ci.source'
    ];

    const getAllCryptoQuery = {
      query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ((cds.crypto_id IS NULL AND ci.attention = ? AND ci.source = ?) OR (cds.crypto_id = ci.crypto_id AND cds.attention = ? AND cds.platform = ?))`,
      post: [
        0,
        configCoinMarketCap.source,
        1,
        configCoinMarketCap.source,
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
          reject({error: { code: 103, message: `No crypto from ${configCoinMarketCap.source}`, fid: fid, type: 'debug', trace: result, defaultMessage:false } });
        }
      }
    });

  });
}

function processCryptoUrl(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'processCryptoUrl'
    };

    logger.debug(fid,'invoked');

    const failedUpdate = [];
    const successfullyUpdate = [];

    asyncLib.map(req.passData.cryptoList, (data, callback) => {
      const miniReq = {
        requestId: `${fid.requestId}-${data.crypto_id}-${data.symbol}`,
        passData: {
          handler: req.passData.handler,
        }
      };

      logger.debug({
        requestId: miniReq.requestId,
        handler: miniReq.passData.handler,
        functionName: 'processCryptoUrl'
      },'invoked');

      const platform_crypto_symbol = getPlatformCryptoSymbol(data.name, data.symbol, data.type);
      const data_url = `${config.apis.coin_market_cap.base_url}${config.apis.coin_market_cap.api.individual_crypto}${platform_crypto_symbol}`;

      coin_market_cap_limiter.removeTokens(1, async () => {
        const exists = await utilCommonChecks.checkUrlExists(data_url);  //need to change limiter too

        const insertQuery = {
          query: 'REPLACE INTO crypto_data_source (crypto_id, platform, platform_crypto_symbol, data_url, attention) VALUES (?, ?, ?, ?, ?)',
          post: [
            data.crypto_id,
            configCoinMarketCap.source,
            platform_crypto_symbol,
            data_url,
            (exists ? 0 : 1)
          ]
        };

        utilMysql.queryMysql(miniReq, 'db_crypto', insertQuery.query, insertQuery.post, (err, result) => {
          if (err) {
            failedUpdate.push(data.crypto_id);
            callback(null, false);
          } else {
            successfullyUpdate.push(data.crypto_id);
            callback(null, true);
          }
        });
      });

    }, (err, result) => {
      req.passData.failedUpdate = failedUpdate;
      req.passData.successfullyUpdate = successfullyUpdate;
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
      failed_update_count: req.passData.failedUpdate.length,
      successfull_update_count: req.passData.successfullyUpdate.length,
      failed_update: req.passData.failedUpdate,
      successfull_update: req.passData.successfullyUpdate

    };

    resolve(responseBody);
  });
}
