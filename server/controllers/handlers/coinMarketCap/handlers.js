'use strict';

const {
  logger,
  response,
  utilMemory
} = require(__base + '/server/utilities/utils');

const config = require(__base + '/server/config/config');

const multiSourceInvokation = require(`${__base}/server/controllers/handlers/coinMarketCap/independentHandlers/multiSourceInvokation`);

module.exports.updateCryptoDataSourceHandler = (req, res) => {
  logger.request('updateCryptoDataSourceHandler', req);
  req.passData.handler = 'updateCryptoDataSourceHandler';

  const miniReq = {
    requestId: req.requestId,
    passData: {
      handler: req.passData.handler
    }
  };

  multiSourceInvokation.updateCoinMarketCapDataSource(miniReq);

  response.success(req, {
    in_progress: true,
    requestId: req.requestId
  }, res);

};
