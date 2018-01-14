'use strict';
const config = require(__base + '/server/config/config');

const {
  logger,
  response,
  utilCommonChecks
} = require(__base + '/server/utilities/utils');

module.exports = (req, res) => {
  logger.request('home',req);
  req.passData.handler = 'home';

  utilCommonChecks.checkIfJsonRequest(req)
  .then(responseBody)
  .then((data) => {
    response.success(req, data, res);
  })
  .catch((err) => {
    response.failure(req, err, res);
  });
};

function responseBody(req) {
  return new Promise((resolve, reject) => {
    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'getStatus'
    };

    logger.debug(fid,'invoked');

    const responseBody = {
      application: config.app.application,
      status: true
    };

    resolve(responseBody);
  });
}
