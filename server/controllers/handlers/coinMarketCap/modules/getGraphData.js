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
        // getAllCryptoQuery = {
        //   query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ci.crypto_id IS NOT NULL AND cds.crypto_id IS NOT NULL AND cds.platform_crypto_symbol IS NOT NULL AND ci.source = cds.platform AND ci.attention = ? AND cds.attention = ? AND cds.platform = ?`,
        //   post: [
        //     0,
        //     0,
        //     configCoinMarketCap.source
        //   ]
        // };

        //tmp-->

        const escapeList = [
          "'ebf019f4-08f6-50cf-9320-91139e5fade6'",
          "'ef8dd330-d113-5169-b7fb-29ce89262175'",
          "'53962651-c545-52cf-ac28-af3648cdfd68'",
          "'234982e5-2004-50a7-ad41-17afe61835db'",
          "'a4eed946-9aa8-5b41-a13f-96f1f291be45'",
          "'b702f34c-5a3b-56d2-b466-5e4dae52a453'",
          "'63cef84a-ac6a-50bc-9788-a0c2108b4e44'",
          "'c94257aa-957c-5a5e-b0c7-de9bfdd4b221'",
          "'0042bc7f-ab4b-55ba-a179-c90828367b42'",
          "'95c2303f-cd9e-5f62-a4e5-aeb9cbdcce83'",
          "'e1e8f60c-41fb-5103-9240-4d9c652d13b7'",
          "'f6173218-7c45-553d-b8c8-a6a09d1a217a'",
          "'70a1becb-9e3f-5ad3-b8ca-8cb3a9fb12d3'",
          "'2c540ae2-22f5-5973-9ed4-33a93450118c'",
          "'c7a94a5f-0bcb-5781-9e3f-816874958584'",
          "'810166dd-32e8-5314-8292-ffc8a0b1377c'",
          "'c50ee6e2-4d11-5ef9-a8fc-b8fe5694e121'",
          "'9b472895-a811-51c4-a634-fd3c105c4a38'",
          "'12312c07-2056-59e7-95b7-c2921a93c2ce'",
          "'9229be0e-72b2-5acd-a888-bb727895e8d3'",
          "'3574ef8c-ea0c-5134-93a1-2556f5260fc6'",
          "'9d7387f1-1ae5-57be-ac20-610f9fe04840'",
          "'f2b954e7-29a2-5403-b1e6-5a2030daf368'",
          "'e62dbe60-469b-5c90-b60d-dfd93d9c5fc1'",
          "'cdca43b5-17b1-546d-86e8-60fcc1cfe6f1'",
          "'bf911025-c6ab-5dee-aa50-df6728ebe2fc'",
          "'464b26f3-d622-5269-b4c2-65a8cff54d38'",
          "'930e3dd1-cc4c-5cf5-b811-da5f6dbd6d23'",
          "'5bc35907-06d3-567d-a5fb-6f894c8f9141'",
          "'6a7a92e1-2f3e-546a-b020-3ee530e23bb1'",
          "'0ad6ab2e-74bb-5239-93c6-f9be8590a45e'",
          "'1760c421-0822-5666-8132-76ab2fc51a7e'",
          "'3a021846-4c09-509a-aef4-3855d60f9d8b'",
          "'e811011a-6f02-5baa-afec-607507419609'",
          "'85a6e82b-3ba6-56a9-93a5-da9215e4cd89'",
          "'d7d0e9b3-81fb-5020-90d3-b35f4d02a2f5'",
          "'8480851e-f07c-5141-b9f9-9fbdb3eab33c'",
          "'7640a23a-558a-5bca-acc0-0fca8cb01cc8'",
          "'acf32c66-2767-5c26-ae17-c22f74e55399'",
          "'efe997e9-b8dd-5ab8-bd6b-c4ba272823f1'",
          "'43b82d3a-4df9-5f87-94e1-bd32cad83843'",
          "'105433a6-b2ce-5077-a0a1-43425b524cd2'",
          "'7348f2d6-9d5c-5e37-a27a-744182b9da05'",
          "'3ef1f4ea-57d0-55e6-860f-69e6eaeea601'",
          "'6a766a9c-a2d1-5981-bbb1-4f9a637bbfc4'",
          "'88997874-c1d9-50ce-a692-2812d654bb74'",
          "'cd5ba0d8-6d73-5a62-b761-4f44d64b80da'",
          "'ccb1f50f-e52b-5795-bafb-8a79030b3a3c'",
          "'0d7e07be-1e82-593f-a899-72acb3cb643f'",
          "'9cbfe624-3f20-5ed0-9408-f18a0cff4cfb'",
          "'69025623-2288-52c1-aee0-ce2cc36afc02'",
          "'45e68d03-612f-57e3-a079-f23c313f615f'",
          "'a9d5e309-c350-5f72-a25d-ce438655eb7a'",
          "'8db5ab33-11e8-5c8a-8cca-df4a474dc9c6'",
          "'2098a7e9-5c09-541e-b4cd-1a5fa766c54b'",
          "'c2e60992-bd1d-5349-9635-e4d619a96641'",
          "'f0e5dc92-b636-5ab5-a22d-17c64d61ccbd'",
          "'473b1059-1674-5ca0-bd02-244a7185450c'",
          "'631583d6-169b-5f07-81db-c094113e6005'",
          "'6b899b4f-d692-5d48-a6ac-be968f9e73ab'",
          "'e27f915b-e77f-5cbe-bd53-0477e68cb33c'",
          "'2153d54f-f250-5421-9a9b-ba90f9025cf7'",
          "'96fd1574-88c1-5c2a-b9ce-dbf604fab735'",
          "'3cc8476d-5979-5d95-aa6b-3111a38ff65d'",
          "'a32258b9-1272-59f5-a65d-965348ffaf82'",
          "'dd2277bd-5f5a-5f08-8006-e2052f7d517b'",
          "'a2997ba2-7970-5837-a9be-48cb2cc60787'",
          "'4825ef69-366d-5a7d-9625-ac4d10eee86f'",
          "'57b2e441-c135-57ed-ac5a-e9ef3cbe0fdb'",
          "'2db211e4-064d-5625-a342-7a431836fdfd'",
          "'84c7d8ad-97c6-5701-9e38-6256b79f70d3'",
          "'f5d6ec2b-42cc-58d0-9bb1-592bea846ab4'",
          "'3b4138a0-0766-5b58-8dee-ef0ce9bf62cd'",
          "'df98e57d-dcb2-56c4-a779-a8444968f7c3'",
          "'28436de9-9e53-5866-b33d-0a2b6c7b272a'",
          "'3f44360e-0db2-58ca-b277-b20e579fa50a'"
        ];
        getAllCryptoQuery = {
          query: `SELECT ${getFields.join(', ')} FROM crypto_info as ci LEFT JOIN crypto_data_source as cds ON ci.crypto_id = cds.crypto_id WHERE ci.crypto_id IS NOT NULL AND cds.crypto_id IS NOT NULL AND cds.platform_crypto_symbol IS NOT NULL AND ci.source = cds.platform AND ci.attention = ? AND cds.attention = ? AND cds.platform = ? AND (ci.crypto_id NOT IN (${escapeList.join(',')}))`,
          post: [
            0,
            0,
            configCoinMarketCap.source
          ]
        };
        //<--tmp
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

    asyncLib.mapSeries(req.passData.crypto_ids, (crypto_id, callback) => {
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
