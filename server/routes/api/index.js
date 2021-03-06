'use strict';

const multer  = require('multer');
const upload = multer({ dest: `${__base}/server/uploads/` });

//module with all the api routes
const apiRoutes = require(`${__base}/server/routes/api/config/routes`);
const httpsSecureCheck = require(`${__base}/server/routes/api/httpsSecureCheck`);

const controller = require(`${__base}/server/controllers/controller`);

exports = module.exports = (app) => {

  //POST
  app.post(apiRoutes.coinMarketCap_GraphDataUpdate, controller.coinMarketCap_GraphDataUpdate);

  //GET
  app.get(apiRoutes.home, controller.home);
  app.get(apiRoutes.coinMarketCap_UpdateCryptoList, controller.coinMarketCap_UpdateCryptoList);
  app.get(apiRoutes.coinMarketCap_UpdateCryptoDataSource, controller.coinMarketCap_UpdateCryptoDataSource);
  app.get(apiRoutes.getRequestStatus, controller.local_GetRequestStatus);
  app.get(apiRoutes.coinMarketCap_ScrapAllHistoricalData, controller.coinMarketCap_ScrapAllHistoricalData);

  //PUT
  app.put(apiRoutes.updateCryptoInfo, controller.local_UpdateCryptoInfo);
  app.put(apiRoutes.updateCryptoDataSourceRecord, controller.local_UpdateCryptoDataSourceRecord);

  //DEL

  //PATCH

};
