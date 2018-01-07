'use strict';

const async = require("async");
const validator = require("validator");

const config = require(__base + '/server/config/config');

const {
  logger,
  response,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const websiteScrape = require(__base + '/server/controllers/utilities/websiteScrape');
const processNewCoin = require(__base + '/server/controllers/modules/processNewCoin');

module.exports = (req, res) => {
  logger.request('updateCryptoList',req);
  req.passData.handler = 'updateCryptoList';

  parameterValidation(req)
  .then(getCryptoTable)
  .then(identifyDesiredTables)
  .then(processDesiredTable)
  .then(responseBody)
  .then((data) => {
    response.success(req, data, res);
  })
  .catch((err) => {
    response.failure(req, err, res);
  });
};

function parameterValidation(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'parameterValidation'
    };

    logger.debug(fid,'invoked');

    const acceptedParams = [
      'coins',
      'tokens'
    ];

    const type = req.params.type;

    if (type) {
      if (acceptedParams.includes(type)) {
        req.passData.type = req.params.type;
        resolve(req);
      } else {
        reject({error: { code: 103, message: `Not a valid type: ${type}`, fid: fid, type: 'debug', trace: null, defaultMessage:false } });
      }
    } else {
      reject({error: { code: 103, message: "Missing required param (type)", fid: fid, type: 'debug', trace: null, defaultMessage:false } });
    }
  });
}

function getCryptoTable(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getCryptoTable'
    };

    logger.debug(fid,'invoked');

    let url = config.apis.coin_market_cap.base_url;

    switch (req.passData.type) {
      case 'coins':
        url += config.apis.coin_market_cap.api.all_coin;
        break;

      case 'tokens':
        url += config.apis.coin_market_cap.api.all_token;
        break;

      default:
        reject({error: { code: 103, message: `Api for the supplied type not available ${req.passData.type}`, fid: fid, type: 'error', trace: null, defaultMessage:false }});
    }

    websiteScrape.getTableFromHtml(req, url, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'debug', trace: null, defaultMessage:false }});
      } else {
        if (result.length > 0) {
          req.passData.cryptTable = result;

          resolve(req);
        } else {
          reject({error: { code: 105, message: "There is no table that could be retrieved", fid: fid, type: 'debug', trace: null, defaultMessage:false }});
        }
      }
    });
  });
}

function identifyDesiredTables(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'identifyDesiredTables'
    };

    logger.debug(fid,'invoked');

    const requiredAttributes = [
      '#',
      'Name',
      'Symbol',
      'Market Cap',
      'Price',
      'Circulating Supply',
      'Volume (24h)',
      '% 1h',
      '% 24h',
      '% 7d'
    ];

//for token
    // [ '#',//
    //   'Name',//
    //   'Platform',
    //   'Market Cap',//
    //   'Price',//
    //   'Circulating Supply',//
    //   'Volume (24h)',//
    //   '% 1h',//
    //   '% 24h',//
    //   '% 7d' ]//

    const checkIfArrayAttributeCorrect = (crypto) => {
      const attributeKeys = Object.keys(crypto);

      const result = requiredAttributes.map((attribute) => {
        if (attributeKeys.indexOf(attribute) > -1) {
          return true;
        } else {
          return false;
        }
      });

      if (result.indexOf(false) > -1) {
        return false;
      } else {
        return true;
      }
    };

    const desiredTables = [];

    async.mapLimit(req.passData.cryptTable, 5, (cryptTable, callback) => {
      if (cryptTable.constructor === Array && cryptTable.length > 0 && utilCommonChecks.isJSON(cryptTable[0]) && checkIfArrayAttributeCorrect(cryptTable[0])) {
        desiredTables.push(cryptTable);
        callback(null, true);
      } else {
        callback(null, false);
      }
    }, (err, result) => {
      if (desiredTables.length > 0) {
        req.passData.desiredTables = desiredTables;
        resolve(req);
      } else {
        reject({error: { code: 105, message: "There is no table with all the required headers", fid: fid, type: 'debug', trace: null, defaultMessage:false }});
      }
    });

  });
}

function processDesiredTable(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'processDesiredTable'
    };

    logger.debug(fid,'invoked');

    async.mapLimit(req.passData.desiredTables, 5, (cryptTable, callback) => {
      let added = 0;
      let notAdded = 0;
      async.mapLimit(cryptTable, 5, (crypto, callback2) => {
        const splitData = crypto.Name.split("\n");

        const miniReq = {
          requestId: `${req.requestId}-${crypto.Symbol}`,
          passData: {
            handler: req.passData.handler,
            payload: {
              symbol: crypto.Symbol,
              name: (splitData.length === 2 ? splitData[1].trim() : 'NEED_ATTENTION'),
              type: req.passData.type,
            }
          }
        };

        const returnBody = {};
        returnBody[crypto.Symbol] = false;

        processNewCoin.processNewCoinHandler(miniReq)
        .then((data) => {
          added++;
          returnBody[crypto.Symbol] = true;
          callback2(null, returnBody);
        })
        .catch((err) => {
          logger.log_reject(miniReq, err);
          notAdded++;
          callback2(null, returnBody);
        });

      }, (err, result2) => {
        callback(null, {
          total_crypto: cryptTable.length,
          result: result2,
          total_added: added,
          not_added: notAdded
        });
      });

    }, (err, result) => {
      req.passData.desiredTablesResult = result;
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
      total_tables: req.passData.desiredTables.length,
      results_array: req.passData.desiredTablesResult
    };

    resolve(responseBody);
  });
}
