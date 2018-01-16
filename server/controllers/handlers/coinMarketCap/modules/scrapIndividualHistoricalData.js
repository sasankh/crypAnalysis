'use strict';

const asyncLib = require("async");
const validator = require("validator");
const moment = require("moment");
const uuidv5 = require('uuid/v5');

const config = require(__base + '/server/config/config');

const {
  logger,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);
const coin_market_cap_limiter = require(__base + '/server/init/limiter').coin_market_cap_limiter;

const websiteScrape = require(__base + '/server/controllers/utilities/websiteScrape');
const processNewCoin = require(__base + '/server/controllers/modules/processNewCoin');
const processNewToken = require(__base + '/server/controllers/modules/processNewToken');

module.exports = (req, res) => {

  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'scrapIndividualHistoricalData'
    };

    logger.debug(fid,'invoked');

    parameterValidation(req)
    .then(getCryptoDataSourceInfo)
    .then(getHistoricalDataTable)
    .then(identifyHistoricalDataTable)
    .then(processHistoricalDataTable)
    .then(insertHistoricalDataInDb)
    .then(responseBody)
    .then((data) => {
      resolve(data);
    })
    .catch((err) => {
      reject(err);
    });

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

    if (req.passData && req.passData.crypto_id) {
      if (validator.isUUID(req.passData.crypto_id)) {
        resolve(req);
      } else {
        reject({error: { code: 103, message: `Not a valid crtpto_id: ${req.passData.crypto_id}`, fid: fid, type: 'debug', trace: null, defaultMessage:false } });
      }
    } else {
      reject({error: { code: 103, message: "Missing required param (crypto_id)", fid: fid, type: 'debug', trace: null, defaultMessage:false } });
    }
  });
}

function getCryptoDataSourceInfo(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getCryptoDataSourceInfo'
    };

    logger.debug(fid,'invoked');

    const getFields = [
      'cds.data_url',
      'ci.name',
      'ci.symbol'
    ];

    const getDataSourceQuery = {
      query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ci.crypto_id IS NOT NULL AND cds.crypto_id IS NOT NULL AND cds.data_url IS NOT NULL AND ci.source = cds.platform AND cds.attention = ? AND cds.platform = ? AND cds.crypto_id = ?`,
      post: [
        0,
        configCoinMarketCap.source,
        req.passData.crypto_id
      ]
    };

    utilMysql.queryMysql(req, 'db_crypto', getDataSourceQuery.query, getDataSourceQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        if (result.length > 0) {
          req.passData.cryptoInfo = result[0];
          resolve(req);
        } else {
          reject({error: { code: 103, message: `No valid crypto data source found for crypto_id: ${req.passData.crypto_id}`, fid: fid, type: 'debug', trace: result, defaultMessage:false } });
        }
      }
    });

  });
}

function getHistoricalDataTable(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getHistoricalDataTable'
    };

    logger.debug(fid,'invoked');

    const toDate = moment.utc().format('YYYYMMDD');

    let url = `${req.passData.cryptoInfo.data_url}/historical-data/?start=${configCoinMarketCap.historicalData.startDate}&end=${toDate}`;

    coin_market_cap_limiter.removeTokens(1, () => {
      websiteScrape.getTableFromHtml(req, url, (err, result) => {
        if (err) {
          reject({error: { code: 102, message: err, fid: fid, type: 'debug', trace: null, defaultMessage:false }});
        } else {
          if (result.length > 0) {
            req.passData.scrappedTables = result;
            resolve(req);
          } else {
            reject({error: { code: 102, message: "There is no table that could be retrieved", fid: fid, type: 'debug', trace: null, defaultMessage:false }});
          }
        }
      });
    });
  });
}

function identifyHistoricalDataTable(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'identifyHistoricalDataTable'
    };

    logger.debug(fid,'invoked');

    let requiredAttributes = configCoinMarketCap.historicalData.requiredTableHeaders;

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

    asyncLib.mapLimit(req.passData.scrappedTables, 5, (scrappedTable, callback) => {
      if (scrappedTable.constructor === Array && scrappedTable.length > 0 && utilCommonChecks.isJSON(scrappedTable[0]) && checkIfArrayAttributeCorrect(scrappedTable[0])) {
        desiredTables.push(scrappedTable);
        callback(null, true);
      } else {
        callback(null, false);
      }
    }, (err, result) => {
      if (desiredTables.length > 0) {
        if (desiredTables.length === 1) {
          req.passData.historicalDataTable = desiredTables[0];
          resolve(req);
        } else {
          reject({error: { code: 104, message: "More then one table with the required historical data table. System does not know what to do", fid: fid, type: 'debug', trace: null, defaultMessage:false }});
        }
      } else {
        reject({error: { code: 104, message: "There is no table with all the required headers", fid: fid, type: 'debug', trace: null, defaultMessage:false }});
      }
    });

  });
}

function processHistoricalDataTable(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'processHistoricalDataTable'
    };

    logger.debug(fid,'invoked');

    asyncLib.map(req.passData.historicalDataTable, (data, callback) => {
      const processedData = {
        crypto_id: req.passData.crypto_id,
        source: configCoinMarketCap.source,
        type: 'daily',
        date: moment(new Date(data.Date)).format('YYYY-MM-DD'),
        open: parseFloat(data.Open.replace(new RegExp(',', 'g'), '')),
        high: parseFloat(data.High.replace(new RegExp(',', 'g'), '')),
        low: parseFloat(data.Low.replace(new RegExp(',', 'g'), '')),
        close: parseFloat(data.Close.replace(new RegExp(',', 'g'), '')),
        volume: parseFloat(data.Volume.replace(new RegExp(',', 'g'), '')),
        market_cap: parseFloat(data['Market Cap'].replace(new RegExp(',', 'g'), ''))
      };

      const uuidNameSpace = uuidv5(`${processedData.source}-${processedData.type}-${processedData.date}-${processedData.open}-${processedData.high}-${processedData.low}-${processedData.close}-${processedData.volume}-${processedData.market_cap}`, uuidv5.URL);

      processedData.id = uuidv5(processedData.crypto_id, uuidNameSpace);
      callback(null, processedData);
    }, (err, result) => {
      req.passData.processedHistoricalData = result;
      resolve(req);
    });
  });
}

function insertHistoricalDataInDb(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'insertHistoricalDataInDb'
    };

    logger.debug(fid,'invoked');

    asyncLib.map(req.passData.processedHistoricalData, (data, callback) => {
      const insertBody = [
        data.id,
        data.crypto_id,
        data.source,
        data.type,
        data.date,
        (isNaN(data.open) ? null : data.open),
        (isNaN(data.high) ? null : data.high),
        (isNaN(data.low) ? null : data.low),
        (isNaN(data.close) ? null : data.close),
        (isNaN(data.volume) ? null : data.volume),
        (isNaN(data.market_cap) ? null : data.market_cap)
      ];

      callback(null, insertBody);
    }, (err, post) => {

      const insertQuery = {
        query: 'REPLACE INTO historical_data (id, crypto_id, source, type, date, open, high, low, close, volume, market_cap ) VALUES ?',
        post: [post]
      };

      utilMysql.queryMysql(req, 'db_crypto', insertQuery.query, insertQuery.post, (err, result) => {
        if (err) {
          reject({error: { code: 102, message: err.message, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
        } else {
          req.passData.insertionResult = result;
          resolve(req);
        }
      });
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
      crypto_id: req.passData.crypto_id,
      name: req.passData.cryptoInfo.name,
      symbol: req.passData.cryptoInfo.symbol,
      total_records: req.passData.processedHistoricalData.length
    };

    resolve(responseBody);
  });
}
