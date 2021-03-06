'use strict';

const {
  logger,
  response,
  utilCommonChecks
} = require(__base + '/server/utilities/utils');

const config = require(__base + '/server/config/config');

const multiSourceInvocation = require(`${__base}/server/controllers/handlers/coinMarketCap/independentHandlers/multiSourceInvocation`);

module.exports.updateCryptoDataSourceHandler = (req, res) => {
  logger.request('updateCryptoDataSourceHandler', req);
  req.passData.handler = 'updateCryptoDataSourceHandler';

  const miniReq = {
    requestId: req.requestId,
    passData: {
      handler: req.passData.handler
    }
  };

  multiSourceInvocation.updateCoinMarketCapDataSource(miniReq);

  response.success(req, {
    in_progress: true,
    action: 'Update_Crypto_Data_Source_Coin_Market_Cap',
    requestId: req.requestId
  }, res);

};

module.exports.coinMarketCap_ScrapAllHistoricalDataHandler = (req, res) => {
  logger.request('coinMarketCap_ScrapAllHistoricalDataHandler', req);
  req.passData.handler = 'coinMarketCap_ScrapAllHistoricalDataHandler';

  const miniReq = {
    requestId: req.requestId,
    passData: {
      handler: req.passData.handler,
      passData: {}
    }
  };

  multiSourceInvocation.scrapAllCoinMarketCapHistoricalData(miniReq);

  response.success(req, {
    in_progress: true,
    type: 'Scrap_Historical_Data_Coin_Market_Cap',
    requestId: req.requestId
  }, res);

};

module.exports.coinMarketCap_GraphDataUpdate = (req, res) => {
  logger.request('coinMarketCap_GraphDataUpdate', req);
  req.passData.handler = 'coinMarketCap_GraphDataUpdate';

  utilCommonChecks.checkIfJsonRequest(req)
  .then(() => {
    const miniReq = {
      requestId: req.requestId,
      passData: {
        handler: req.passData.handler,
        payload: req.body
      }
    };

    multiSourceInvocation.getCoinMarketCapGraphData(miniReq);

    response.success(req, {
      in_progress: true,
      type: 'Graph_Data_Update_Coin_Market_Cap',
      requestId: req.requestId
    }, res);

  })
  .catch((err) => {
    response.failure(req, err, res);
  })

};
