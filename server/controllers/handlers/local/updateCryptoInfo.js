'use strict';
const validator = require("validator");
const asyncLib = require("async");

const {
  logger,
  response,
  utilCommonChecks,
  utilMysql
} = require(__base + '/server/utilities/utils');

const configLocal = require(`${__base}/server/controllers/handlers/local/config`);

module.exports = (req, res) => {
  logger.request('updateCryptoInfo',req);
  req.passData.handler = 'updateCryptoInfo';

  utilCommonChecks.checkIfJsonRequest(req)
  .then(bodyValidation)
  .then(updateBodyValidation)
  .then(updateCryptoInfoInDb)
  .then(responseBody)
  .then((data) => {
    response.success(req, data, res);
  })
  .catch((err) => {
    response.failure(req, err, res);
  });
};

function bodyValidation(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'bodyValidation'
    };

    logger.debug(fid,'invoked');

    const requiredAttributes = [
      'crypto_id',
      'update'
    ];

    const payloadAttributes = Object.keys(req.body);

    asyncLib.map(requiredAttributes, (attribute, callback) => {
      if (payloadAttributes.indexOf(attribute) > -1) {
        switch (attribute) {
          case 'crypto_id':
            if (validator.isUUID(req.body.crypto_id)) {
              callback(null, true);
            } else {
              callback(`Not a valid crypto_id: ${req.body.crypto_id}`);
            }
            break;

          case 'update':
            if (utilCommonChecks.isJSON(req.body.update)) {
              callback(null, true);
            } else {
              callback(`Update is not JSON: ${req.body.update}`);
            }
            break;

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
        req.passData.crypto_id = req.body.crypto_id;
        req.passData.update = req.body.update;
        resolve(req);
      }
    });
  });
}

function updateBodyValidation(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'updateBodyValidation'
    };

    logger.debug(fid,'invoked');

    const possibleAttributes = [
      'name',
      'description',
      'platform',
      'symbol',
      'type',
      'attention',
      'url'
    ];

    const updateAttributes = Object.keys(req.passData.update);

    asyncLib.map(updateAttributes, (attribute, callback) => {
      if (possibleAttributes.indexOf(attribute) > -1) {
        switch (attribute) {
          case 'name':
          case 'description':
          case 'platform':
          case 'symbol':
            if (typeof req.passData.update[attribute] === 'string') {
              callback(null, true);
            } else {
              callback(`Update atttribute '${attribute}' is not string: ${req.body.update[attribute]}`);
            }
            break;

          case 'type':
            const allowedTypes = [
              'coins',
              'tokens'
            ];

            if (allowedTypes.indexOf(req.body.update.type) > -1) {
              callback(null, true);
            } else {
              callback(`Update atttribute '${attribute}' is not an allowed type: ${req.body.update[attribute]}`);
            }
            break;

          case 'attention':
            if (typeof req.body.update.attention === 'boolean') {
              callback(null, true);
            } else {
              callback(`Update atttribute '${attribute}' is not a boolean type: ${req.body.update[attribute]}`);
            }
            break;

          case 'url':
            if (validator.isURL(req.body.update.url)) {
              callback(null, true);
            } else {
              callback(`Update atttribute '${attribute}' is not a url: ${req.body.update[attribute]}`);
            }
            break;

          default:
            callback(null, true);
        }
      } else {
        callback(`Not a valid update attribute: ${attribute}`);
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

function updateCryptoInfoInDb(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'updateCryptoInfoInDb'
    };

    logger.debug(fid,'invoked');

    const queryUpdateSet = Object.keys(req.passData.update).map((attribute, index) => {
      switch (attribute) {
        case 'attention':
          return `attention = ${req.passData.update.attention ? 1 : 0}`;

        default:
          return `${attribute.trim()} = ${utilMysql.mysqlEscape(req.passData.update[attribute].trim())}`;
      }
    });

    const updateQuery = {
      query: `UPDATE crypto_info SET ${queryUpdateSet.join(', ')} WHERE crypto_id = ?`,
      post: [
        req.passData.crypto_id
      ]
    };

    utilMysql.queryMysql(req, 'db_crypto', updateQuery.query, updateQuery.post, (err, result) => {
      if (err) {
        reject({error: { code: 102, message: err, fid: fid, type: 'warn', trace: err, defaultMessage:false } });
      } else {
        if (result.affectedRows === 1) {
          req.passData.updateTableResult = result;
          resolve(req);
        } else {
          reject({error: { code: 102, message: "Affected Rows is not 1", fid: fid, type: 'warn', trace: result, defaultMessage:false } });
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
      crypto_id: req.passData.crypto_id,
      complete: true
    };

    resolve(responseBody);
  });
}
