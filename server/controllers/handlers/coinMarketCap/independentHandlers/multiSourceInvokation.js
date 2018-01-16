'use strict';

const {
  logger,
  utilMemory
} = require(__base + '/server/utilities/utils');

const config = require(__base + '/server/config/config');

const updateCryptoDataSource = require(`${__base}/server/controllers/handlers/coinMarketCap/modules/updateCryptoDataSource`);

module.exports.updateCoinMarketCapDataSource = (req) => {
  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'updateCoinMarketCapDataSource'
  };

  logger.debug(fid,'invoked');

  utilMemory.inprogress_request(req, 'add', req.requestId);

  updateCryptoDataSource(req)
  .then((data) => {
    utilMemory.inprogress_request(req, 'remove', req.requestId);
    logger.debug(fid,'UpdateCoinMarketCapDataSource Competed Successfully', data);
  })
  .catch((err) => {
    utilMemory.inprogress_request(req, 'remove', req.requestId);
    logger.log_reject(req, err);
  });
}