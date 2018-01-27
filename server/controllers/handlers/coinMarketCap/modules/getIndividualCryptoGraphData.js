'use strict';

const asyncLib = require("async");
const validator = require("validator");
const moment = require("moment");

const config = require(__base + '/server/config/config');

const {
  logger,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);

const requestProcessGraphData = require(`${__base}/server/controllers/handlers/coinMarketCap/modules/requestProcessGraphData`);

module.exports = (req, res) => {

  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getIndividualCryptoGraphData'
    };

    logger.debug(fid,'invoked');

    parameterValidation(req)
    .then(getCryptoInfo)
    .then(getCurrentRecordsDateRange)
    .then(getCryptoOldestSourceRecordDate)
    .then(checkIfToProceedFor2d)
    .then(generateRequestUrl)
    .then(initiateIndividualUrlRequest)
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

    const requiredParameters = [
      'crypto_id',
      'range_type',
      'direction'
    ];

    const attributeOptions = {
      range_type: [
        'all',
        '2d'
      ],
      direction: [
        'past',
        'future'
      ]
    };

    const suppliedParameters = Object.keys(req.passData);

    asyncLib.map(requiredParameters, (attribute, callback) => {
      if (requiredParameters.indexOf(attribute) > -1) {
        switch(attribute) {
          case 'crypto_id':
            if(validator.isUUID(req.passData.crypto_id)){
              callback(null, true);
            } else {
              callback(`Not a valid crypto_id: '${req.passData.crypto_id}'`);
            }
            break;

          case 'range_type':
          case 'direction':
            if(attributeOptions[attribute].indexOf(req.passData[attribute]) > -1) {
              callback(null, true);
            } else {
              callback(`Not a valid '${attribute}' value ${req.passData[attribute]}`);
            }
            break;

          default:
            callback(null, true);
        }
      } else {
        callback(`Missing required attribute: '${attribute}'`);
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

function getCryptoInfo(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getCryptoInfo'
    };

    logger.debug(fid,'invoked');

    const getFields = [
      'ci.crypto_id',
      'ci.name',
      'ci.symbol',
      'cds.platform_crypto_symbol'
    ];

    const getCryptoDetailsQuery = {
      query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ci.crypto_id IS NOT NULL AND cds.crypto_id IS NOT NULL AND cds.platform_crypto_symbol IS NOT NULL AND ci.source = cds.platform AND ci.attention = ? AND cds.attention = ? AND cds.platform = ? AND ci.crypto_id = ?`,
      post: [
        0,
        0,
        configCoinMarketCap.source,
        req.passData.crypto_id
      ]
    };


    utilMysql.queryMysql(req, 'db_crypto', getCryptoDetailsQuery.query, getCryptoDetailsQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        if (result.length > 0) {
          req.passData.cryptoInfo = result[0];
          resolve(req);
        } else {
          reject({error: { code: 103, message: `No valid crypto matching the required conditions found for crypto_id: ${req.passData.crypto_id}`, fid: fid, type: 'debug', trace: result, defaultMessage:false } });
        }
      }
    });

  });
}

function getCurrentRecordsDateRange(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getCurrentRecordsDateRange'
    };

    logger.debug(fid,'invoked');

    const getFields = [
      'epoch_date'
    ];

    const currentRecordDataRangeQuery = {
      query: `SELECT ${getFields.join(', ')} FROM price_data_epoch where source = ? AND request_type = ? AND crypto_id = ? ORDER BY epoch_date ASC`,
      post: [
        configCoinMarketCap.source,
        req.passData.range_type,
        req.passData.crypto_id
      ]
    };


    utilMysql.queryMysql(req, 'db_crypto', currentRecordDataRangeQuery.query, currentRecordDataRangeQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        if (result.length > 0) {
          req.passData.oldestDate = result[0].epoch_date;
          req.passData.newestDate = result[result.length - 1].epoch_date;
        }
        resolve(req);
      }
    });

  });
}

function getCryptoOldestSourceRecordDate(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getCryptoOldestSourceRecordDate'
    };

    logger.debug(fid,'invoked');

    const getFields = [
      'epoch_date'
    ];

    const cryptoOldestSourceRecordDateQuery = {
      query: `SELECT ${getFields.join(', ')} FROM price_data_epoch where source = ? AND request_type = ? AND crypto_id = ? ORDER BY epoch_date ASC`,
      post: [
        configCoinMarketCap.source,
        'all',
        req.passData.crypto_id
      ]
    };


    utilMysql.queryMysql(req, 'db_crypto', cryptoOldestSourceRecordDateQuery.query, cryptoOldestSourceRecordDateQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        if (result.length > 0) {
          req.passData.cryptoOldestSourceRecordDate = result[0].epoch_date;
        }
        resolve(req);
      }
    });

  });
}

function checkIfToProceedFor2d(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'checkIfToProceedFor2d'
    };

    logger.debug(fid,'invoked');

    if (req.passData.range_type === '2d') {
      if (req.passData.direction === 'past' && req.passData.oldestDate && req.passData.newestDate && (req.passData.oldestDate <= configCoinMarketCap.graphData.defaultPastEpochDate)) {
        reject({error: { code: 103, message: 'Oldest date smaller then or equal to the default past date', fid: fid, type: 'debug', trace: {
          oldestDate: req.passData.oldestDate,
          newestDate: req.passData.newestDate,
          defaultPastDate: configCoinMarketCap.graphData.defaultPastEpochDate,
        }, defaultMessage:false } });
      } else {
        resolve(req);
      }
    } else {
      resolve(req);
    }
  });
}

function generateRequestUrl(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'generateRequestUrl'
    };

    logger.debug(fid,'invoked');

    const toDate = moment.utc().format('YYYYMMDD');

    let url = `${config.apis.coin_market_cap.base_url_graph}/currencies/${req.passData.cryptoInfo.platform_crypto_symbol.trim()}`;

    const urlList = [];

    const currentEpochTime = moment().unix() * 1000;

    if (req.passData.range_type === 'all') {
      if (req.passData.oldestDate && req.passData.newestDate) {
        switch(req.passData.direction) {
          case 'past':
            urlList.push(url);
            break;

          case 'future':
            urlList.push(`${url}/${req.passData.newestDate}/${currentEpochTime}`);
            break;
        }
      } else {
        urlList.push(url);
      }
    }

    if (req.passData.range_type === '2d') {
      let fromDate;
      let toDate;
      const two_day_difference = 172520000;  //2days interval

      if (req.passData.oldestDate && req.passData.newestDate) {
        switch(req.passData.direction) {
          case 'past':
            if (req.passData.cryptoOldestSourceRecordDate && (req.passData.cryptoOldestSourceRecordDate > configCoinMarketCap.graphData.defaultPastEpochDate)) {
              fromDate = req.passData.cryptoOldestSourceRecordDate;
            } else {
              fromDate = configCoinMarketCap.graphData.defaultPastEpochDate;
            }
            toDate = req.passData.oldestDate;
            break;

          case 'future':
            fromDate = req.passData.newestDate;
            toDate = currentEpochTime;
            break;
        }
      } else {
        if (req.passData.cryptoOldestSourceRecordDate && (req.passData.cryptoOldestSourceRecordDate > configCoinMarketCap.graphData.defaultPastEpochDate)) {
          fromDate = req.passData.cryptoOldestSourceRecordDate;
        } else {
          fromDate = configCoinMarketCap.graphData.defaultPastEpochDate;
        }
        toDate = currentEpochTime;
      }

      let x = toDate;

      do {
        urlList.push(`${url}/${x - two_day_difference}/${x}`);
        x -= two_day_difference;
      } while (x > fromDate);

      urlList.push(`${url}/${fromDate}/${x + two_day_difference}`);

      // console.log('fromDate', fromDate);
      // console.log('toDate', toDate)
    }

    // console.log('default', configCoinMarketCap.graphData.defaultPastEpochDate);
    // console.log('cryptoOldestSourceRecordDate', req.passData.cryptoOldestSourceRecordDate);
    // console.log('oldest', req.passData.oldestDate);
    // console.log('newest', req.passData.newestDate)

    req.passData.urlList = urlList;
    resolve(req);


  });
}

function initiateIndividualUrlRequest(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'initiateIndividualUrlRequest'
    };

    logger.debug(fid,'invoked');

    asyncLib.mapSeries(req.passData.urlList, (url, callback) => {
      const miniReq = {
        requestId: `${req.requestId}-${url.replace(config.apis.coin_market_cap.base_url_graph + "/currencies/","")}`,
        passData: {
          handler: req.passData.handler,
          crypto_id: req.passData.crypto_id,
          url,
          range_type: req.passData.range_type
        }
      }

      const response = {
        url,
        error: true
      }

      requestProcessGraphData(miniReq)
      .then((data) => {
        response.error = false;
        callback(null, response);
      })
      .catch((err) => {
        logger.log_reject(miniReq, err);
        response.message = (err && err.message ? err.message : 'Unknown Error. Check Logs')
        callback(response.message, response);
      })
    }, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        req.passData.getGraphDataResults = result;
        resolve(req);
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
      crypto_id: req.passData.crypto_id,
      name: req.passData.cryptoInfo.name,
      symbol: req.passData.cryptoInfo.symbol,
      graph_data_result: req.passData.getGraphDataResults
    };

    resolve(responseBody);
  });
}
