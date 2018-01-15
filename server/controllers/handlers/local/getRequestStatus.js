'use strict';

const {
  logger,
  response,
  utilMemory
} = require(__base + '/server/utilities/utils');

module.exports = (req, res) => {
  logger.request('getRequestStatus',req);
  req.passData.handler = 'getRequestStatus';

  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'getRequestStatus'
  };

  logger.debug(fid,'invoked');

  if (req.params.requestId) {
    const responseBody = {
      inprogress: false
    };

    if (utilMemory.inprogress_request(req, 'find', req.params.requestId)) {
      responseBody.inprogress = true;
    }

    response.success(req, responseBody, res);
  } else {
    response.failure(req, {error: { code: 103, message: "Request ID not present in params", fid: fid, type: 'debug', trace: null, defaultMessage:false } }, res);
  }
};
