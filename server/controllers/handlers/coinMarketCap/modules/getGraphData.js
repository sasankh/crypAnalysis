'use strict';

const asyncLib = require("async");
const moment = require("moment");

const config = require(__base + '/server/config/config');

const {
  logger,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configCoinMarketCap = require(`${__base}/server/controllers/handlers/coinMarketCap/config`);

const getIndividualCryptoGraphData = require(`${__base}/server/controllers/handlers/coinMarketCap/modules/getIndividualCryptoGraphData`);

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
      functionName: 'getGraphData'
    };

    logger.debug(fid,'invoked');

    validatePayload(req)
    .then(getCryptoIdsIfInterestGroup)
    .then(initiateIndividualGraphDataRetrival)
    .then(responseBody)
    .then((data) => {
      resolve(data);
    })
    .catch((err) => {
      reject(err);
    });

  });
};

function validatePayload(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'validatePayload'
    };

    logger.debug(fid,'invoked');

    const requiredAttributes = [
      'type',
      'range_type',
      'direction'
    ];

    const attributeOptions = {
      type: [
        'crypto_ids',
        'interest_group'
      ],
      range_type: [
        'all',
        '2d'
      ],
      direction: [
        'past',
        'future'
      ]
    };

    const payloadAttributes = Object.keys(req.passData.payload);

    asyncLib.map(requiredAttributes, (attribute, callback) => {
      if (payloadAttributes.indexOf(attribute) > -1) {
        switch (attribute) {
          case 'type':
            if(attributeOptions.type.indexOf(req.passData.payload.type) > -1) {
              switch(req.passData.payload.type) {
                case 'crypto_ids':
                case 'interest_group':
                  if (req.passData.payload[req.passData.payload.type] !== undefined && req.passData.payload[req.passData.payload.type] !== null) {
                    switch(req.passData.payload.type) {
                      case 'crypto_ids':
                        const crypto_ids = req.passData.payload.crypto_ids;
                        if (typeof crypto_ids === 'object' && crypto_ids.constructor === Array) {
                          callback(null, true);
                        } else {
                          callback(`Not a valid crypto_ids type`);
                        }
                        break;

                      case 'interest_group':
                        if (Number.isInteger(req.passData.payload.interest_group)) {
                          callback(null, true);
                        } else {
                          callback(`Not a valid interest_group type`);
                        }
                        break;

                      default:
                        logger.error(fid, `No validation available for required attribute: '${req.passData.payload.type}'`);
                        callback(`No validation available for required attribute: '${req.passData.payload.type}'. Notify developer. System issue`);
                    }
                  } else {
                    callback(`Missing required secondary attribute for type: '${attribute}'`);
                  }
                  break;

                default:
                  callback(null, true);
              }
            } else {
              callback(`Not a valid '${attribute}' value ${req.passData.payload[attribute]}`);
            }
          break;

          case 'range_type':
          case 'direction':
            if(attributeOptions[attribute].indexOf(req.passData.payload[attribute]) > -1) {
              callback(null, true);
            } else {
              callback(`Not a valid '${attribute}' value ${req.passData.payload[attribute]}`);
            }
          break;

          default:
            logger.error(fid, `No validation available for required attribute: '${attribute}'`);
            callback(`No validation available for required attribute: '${attribute}'. Notify developer. System issue`);
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

function getCryptoIdsIfInterestGroup(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getCryptoIdsIfInterestGroup'
    };

    logger.debug(fid,'invoked');

    if (req.passData.payload.type === 'interest_group') {
      const getFields = [
        'cds.crypto_id',
      ];

      let getAllCryptoQuery = {};

      if (req.passData.payload.interest_group === 0) {
        getAllCryptoQuery = {
          query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ci.crypto_id IS NOT NULL AND cds.crypto_id IS NOT NULL AND cds.platform_crypto_symbol IS NOT NULL AND ci.source = cds.platform AND ci.attention = ? AND cds.attention = ? AND cds.platform = ?`,
          post: [
            0,
            0,
            configCoinMarketCap.source
          ]
        };
      } else {
        getAllCryptoQuery = {
          query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ci.crypto_id IS NOT NULL AND cds.crypto_id IS NOT NULL AND cds.platform_crypto_symbol IS NOT NULL AND ci.source = cds.platform AND ci.attention = ? AND cds.attention = ? AND cds.platform = ? AND ci.interest_group = ?`,
          post: [
            0,
            0,
            configCoinMarketCap.source,
            req.passData.payload.interest_group
          ]
        };
      }

      utilMysql.queryMysql(req, 'db_crypto', getAllCryptoQuery.query, getAllCryptoQuery.post, (err, result) => {
        if (err) {
          reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
        } else {
          if (result.length > 0) {
            req.passData.crypto_ids = result.map((crypto_data) => {
              return crypto_data.crypto_id;
            });
            resolve(req);
          } else {
            reject({error: { code: 103, message: `Crypto List empty for interest_group: ${req.passData.payload.interest_group}`, fid: fid, type: 'debug', trace: result, defaultMessage:false } });
          }
        }
      });

    } else {
      if (req.passData.payload.crypto_ids.length > 0) {
        req.passData.crypto_ids = req.passData.payload.crypto_ids;
        resolve(req);
      } else {
        reject({error: { code: 103, message: `Crypto List empty for interest_group: ${req.passData.payload.interest_group}`, fid: fid, type: 'debug', trace: result, defaultMessage:false } });
      }
    }
  });
}

function initiateIndividualGraphDataRetrival(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'initiateIndividualGraphDataRetrival'
    };

    logger.debug(fid,'invoked');

    asyncLib.map(req.passData.crypto_ids, (crypto_id, callback) => {
      const miniReq = {
        requestId: `${fid.requestId}-${crypto_id}`,
        passData: {
          handler: req.passData.handler,
          crypto_id: crypto_id,
          range_type: req.passData.payload.range_type,
          direction: req.passData.payload.direction
        }
      };

      const response = {
        crypto_id,
        error: true
      }

      getIndividualCryptoGraphData(miniReq)
      .then((data) => {
        response.error = false;
        callback(null, response);
      })
      .catch((err) => {
        logger.log_reject(miniReq, err);
        if (err && err.message) {
          response.message = err.message;
        } else if (err && err.error && err.error.message) {
          response.message = err.error.message;
        } else {
          response.message = 'Unknown Error. Check log';
        }

        callback(null, response);
      })

    }, (err, result) => {
      req.passData.graphRetrivalResult = result;
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
      crypto_processed: req.passData.crypto_ids.length,
      result: req.passData.graphRetrivalResult
    };

    resolve(responseBody);
  });
}
