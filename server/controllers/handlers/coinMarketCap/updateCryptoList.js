'use strict';

const asyncLib = require("async");
const validator = require("validator");

const config = require(__base + '/server/config/config');

const {
  logger,
  response,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);

const websiteScrape = require(__base + '/server/controllers/utilities/websiteScrape');
const processNewCoin = require(__base + '/server/controllers/modules/processNewCoin');
const processNewToken = require(__base + '/server/controllers/modules/processNewToken');

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
          reject({error: { code: 102, message: "There is no table that could be retrieved", fid: fid, type: 'debug', trace: null, defaultMessage:false }});
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

    let requiredAttributes = [];

    switch (req.passData.type) {
      case 'coins':
        requiredAttributes = configCoinMarketCap.requiredHeaders.coins;
        break;

      case 'tokens':
        requiredAttributes = configCoinMarketCap.requiredHeaders.tokens;
        break;
    }

    const checkIfArrayAttributeCorrect = (crypto) => {
      const attributeKeys = Object.keys(crypto);
      logger.debug(fid, "Attribute Keys: ", attributeKeys);

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

    asyncLib.mapLimit(req.passData.cryptTable, 5, (cryptTable, callback) => {
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
        reject({error: { code: 104, message: "There is no table with all the required headers", fid: fid, type: 'debug', trace: null, defaultMessage:false }});
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

    asyncLib.mapLimit(req.passData.desiredTables, 5, (cryptTable, callback) => {
      let addedList = [];
      let addErrorList = [];

      asyncLib.mapLimit(cryptTable, 5, (crypto, callback2) => {
        const cryptoName = crypto[configCoinMarketCap.correspondingAttribute.Name].trim();

        let miniReq = {};
        let cryptoSymbol = "TO BE DETERMINED";
        const splitName = cryptoName.split("\n");
        let handlerFunction = 'NEED TO BE DETERMINED';

        switch (req.passData.type) {
          case 'coins':
            cryptoSymbol = crypto[configCoinMarketCap.correspondingAttribute.Symbol].trim();
            miniReq = {
              requestId: `${req.requestId}-${cryptoSymbol}`,
              passData: {
                handler: req.passData.handler,
                payload: {
                  symbol: cryptoSymbol,
                  name: (splitName.length === 2 ? splitName[1].trim() : cryptoName),
                  type: req.passData.type,
                  source: configCoinMarketCap.source
                }
              }
            };
            handlerFunction = processNewCoin.processNewCoinHandler;
          break;

          case 'tokens':
            cryptoSymbol = (splitName.length === 2 ? splitName[0].trim() : cryptoName),
            miniReq = {
              requestId: `${req.requestId}-${cryptoSymbol}`,
              passData: {
                handler: req.passData.handler,
                payload: {
                  symbol: cryptoSymbol,
                  name: (splitName.length === 2 ? splitName[1].trim() : cryptoName),
                  type: req.passData.type,
                  platform: crypto[configCoinMarketCap.correspondingAttribute.Platform].trim(),
                  source: configCoinMarketCap.source
                }
              }
            };
            handlerFunction = processNewToken.processNewTokenHandler;
            break;
        }

        const returnBody = {
          symbol: cryptoSymbol,
          name: miniReq.passData.payload.name,
          added: false,
          message: 'UNKNOWN'
        };

        handlerFunction(miniReq)
        .then((data) => {
          returnBody.added = true;
          returnBody.message = "Successfully Added";
          addedList.push(cryptoSymbol);
          callback2(null, returnBody);
        })
        .catch((err) => {
          logger.log_reject(miniReq, err);
          returnBody.message = (err && err.error && err.error.message ? err.error.message : 'UNKNOWN');
          addErrorList.push(returnBody);
          callback2(null, returnBody);
        });

      }, (err, result2) => {
        const total_crypto = cryptTable.length;
        const total_added = addedList.length;
        const total_add_error = addErrorList.length;
        const unknown_status_count = total_crypto - total_added - total_add_error;

        callback(null, {
          total_crypto,
          total_added,
          total_add_error,
          unknown_status_count,
          error_adding_list: addErrorList
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
      tables_results_array: req.passData.desiredTablesResult
    };

    resolve(responseBody);
  });
}
