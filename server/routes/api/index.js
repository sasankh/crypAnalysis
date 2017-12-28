'use strict';

const multer  = require('multer');
const upload = multer({ dest: `${__base}/server/uploads/` });

//module with all the api routes
const apiRoutes = require(`${__base}/server/routes/api/config/routes`);

const httpsSecureCheck = require(`${__base}/server/routes/api/httpsSecureCheck`);

exports = module.exports = (app) => {

  //POST

  //GET

  //PUT

  //DEL

  //PATCH

};
