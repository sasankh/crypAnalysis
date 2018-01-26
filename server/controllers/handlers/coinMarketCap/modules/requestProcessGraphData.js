'use strict';

const asyncLib = require("async");
const validator = require("validator");
const uuidv5 = require('uuid/v5');
const request = require('request');

const config = require(__base + '/server/config/config');

const {
  logger,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);
const coin_market_cap_limiter = require(__base + '/server/init/limiter').coin_market_cap_limiter;

module.exports = (req, res) => {

  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'requestProcessGraphData'
    };

    logger.debug(fid,'invoked');

    parameterValidation(req)
    .then(makeHttpRequest)
    .then(verifyResponsePayload)
    .then(processRetrievedData)
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

    if (req.passData && req.passData.crypto_id && req.passData.url && req.passData.range_type && validator.isUUID(req.passData.crypto_id) && validator.isURL(req.passData.url)) {
      resolve(req);
    } else {
      reject({error: { code: 103, message: 'Missing or invalid required parameters', fid: fid, type: 'debug', trace: req.passData, defaultMessage:false } });
    }
  });
}

function makeHttpRequest(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'makeHttpRequest'
    };

    logger.debug(fid,'invoked');

    coin_market_cap_limiter.removeTokens(1, () => {
      request.get(req.passData.url, (err, respones, body) => {
        if(err) {
          reject({error: { code: 103, message: err.message, fid: fid, type: 'debug', trace: err, defaultMessage:false } });
        } else {
          const responseBody = utilCommonChecks.getJSON(body); //return false if not JSON
          if (responseBody) {
            req.passData.httpRespones = responseBody;
            resolve(req);
          } else {
            reject({error: { code: 103, message: 'Retrieved response is not a JSON', fid: fid, type: 'debug', trace: body, defaultMessage:false } });
          }
        }
      });
    });
  });
}

function verifyResponsePayload(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'verifyResponsePayload'
    };

    logger.debug(fid,'invoked');

    const requiredAttributes = [
      'market_cap_by_available_supply',
      'price_btc',
      'price_usd',
      'volume_usd'
    ];

    const responseAttributes = Object.keys(req.passData.httpRespones);

    asyncLib.map(requiredAttributes, (attribute, callback) => {
      if (responseAttributes.indexOf(attribute) > -1) {
        switch(attribute) {
          case 'market_cap_by_available_supply':
          case 'price_btc':
          case 'price_usd':
          case 'volume_usd':
            if (
              Array.isArray(req.passData.httpRespones[attribute]) &&
              req.passData.httpRespones[attribute].length > 0 &&
              Array.isArray(req.passData.httpRespones[attribute][0]) &&
              req.passData.httpRespones[attribute][0].length === 2
            ) {
              callback(null, true);
            } else {
              callback(`Respones attribute (${attribute}) is not an Array OR an array with sub array with length 2`);
            }
            break;

          default:
           callback(null, true);
        }
      } else {
        callback(`Missing required attribute in response: ${attribute}`);
      }
    }, (err, result) => {
      if (err) {
        reject({error: { code: 103, message: err, fid: fid, type: 'debug', trace: req.passData.url, defaultMessage:false } });
      } else {
        resolve(req);
      }
    });
  });
}


function processRetrievedData(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'processRetrievedData'
    };

    logger.debug(fid,'invoked');

    //get namespace function
    const getNameSpace = (epoch_date) => {
      return uuidv5(`${configCoinMarketCap.source}-${req.passData.range_type}-${epoch_date}`, uuidv5.URL);
    }

    //getPost
    const getPosts = (attribute) => {
      return req.passData.httpRespones[attribute].map((data) => {
        return [
          uuidv5(req.passData.crypto_id, getNameSpace(data[0])),
          req.passData.crypto_id,
          configCoinMarketCap.source,
          req.passData.range_type,
          data[0],
          data[1]
        ];
      });
    }

    const queries = {
      price_usd: {
        query: 'INSERT INTO price_data_epoch (id, crypto_id, source, request_type, epoch_date, price_usd) VALUES ? ON DUPLICATE KEY UPDATE price_usd=VALUES(price_usd)',
        post: getPosts('price_usd')
      },
      price_btc: {
        query: 'INSERT INTO price_data_epoch (id, crypto_id, source, request_type, epoch_date, price_btc) VALUES ? ON DUPLICATE KEY UPDATE price_btc=VALUES(price_btc)',
        post: getPosts('price_btc')
      },
      volume_24hr: {
        query: 'REPLACE INTO volume_24hr (id, crypto_id, source, request_type, epoch_date, volume) VALUES ?',
        post: getPosts('volume_usd')
      },
      market_cap: {
        query: 'REPLACE INTO market_cap (id, crypto_id, source, request_type, epoch_date, market_cap) VALUES ?',
        post: getPosts('market_cap_by_available_supply')
      }
    };

    const insertQuery = {
      query: `${queries.price_usd.query};${queries.price_btc.query};${queries.volume_24hr.query};${queries.market_cap.query}`,
      post: [queries.price_usd.post, queries.price_btc.post, queries.volume_24hr.post, queries.market_cap.post]
    }

    utilMysql.queryMysql(req, 'db_crypto', insertQuery.query, insertQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        logger.debug(fid, 'Insert Query result', result);
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
      url: req.passData.url,
      status: 'complete'
    };

    resolve(responseBody);
  });
}
