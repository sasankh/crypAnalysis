'use strict';

const multer  = require('multer');
const upload = multer({ dest: `${__base}/server/uploads/` });

//module with all the api routes
const apiRoutes = require(`${__base}/server/routes/api/config/routes`);
const httpsSecureCheck = require(`${__base}/server/routes/api/httpsSecureCheck`);

const controller = require(`${__base}/server/controllers/controller`);

exports = module.exports = (app) => {

  //POST

  //GET
  app.get(apiRoutes.home, controller.home);
  app.get(apiRoutes.coinMarketCap_UpdateCryptoList, controller.coinMarketCap_UpdateCryptoList);
  app.get(apiRoutes.coinMarketCap_UpdateCryptoDataSource, controller.coinMarketCap_UpdateCryptoDataSource);
  app.get(apiRoutes.getRequestStatus, controller.local_GetRequestStatus);

  //PUT
  app.put(apiRoutes.updateCryptoInfo, controller.local_UpdateCryptoInfo);

  //DEL

  //PATCH

};
