'use strict';

const {
  logger,
  utilMemory
} = require(__base + '/server/utilities/utils');

const config = require(__base + '/server/config/config');

const updateCryptoDataSource = require(`${__base}/server/controllers/handlers/coinMarketCap/modules/updateCryptoDataSource`);
const scrapAllHistoricalData = require(`${__base}/server/controllers/handlers/coinMarketCap/modules/scrapAllHistoricalData`);
const getGraphData = require(`${__base}/server/controllers/handlers/coinMarketCap/modules/getGraphData`);

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
    logger.debug(fid,'UpdateCoinMarketCapDataSource Completed Successfully', data);
  })
  .catch((err) => {
    utilMemory.inprogress_request(req, 'remove', req.requestId);
    logger.log_reject(req, err);
  });
}

module.exports.scrapAllCoinMarketCapHistoricalData = (req) => {
  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'scrapAllCoinMarketCapHistoricalData'
  };

  logger.debug(fid,'invoked');

  utilMemory.inprogress_request(req, 'add', req.requestId);

  scrapAllHistoricalData(req)
  .then((data) => {
    utilMemory.inprogress_request(req, 'remove', req.requestId);
    logger.debug(fid,'Scrap All CoinMarketCap Historical Data Completed Successfully', data);
  })
  .catch((err) => {
    utilMemory.inprogress_request(req, 'remove', req.requestId);
    logger.log_reject(req, err);
  });
}

module.exports.getCoinMarketCapGraphData = (req) => {
  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'getCoinMarketCapGraphData'
  };

  logger.debug(fid,'invoked');

  utilMemory.inprogress_request(req, 'add', req.requestId);

  getGraphData(req)
  .then((data) => {
    utilMemory.inprogress_request(req, 'remove', req.requestId);
    logger.debug(fid,'Get Graph Data Completed Successfully', data);
  })
  .catch((err) => {
    utilMemory.inprogress_request(req, 'remove', req.requestId);
    logger.log_reject(req, err);
  });
}
