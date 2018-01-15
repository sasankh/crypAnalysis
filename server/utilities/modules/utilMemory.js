'use strict';

const memory = require(__base + '/server/config/config').memory;
const logger = require(__base + '/server/utilities/modules/logger');

module.exports.inprogress_request = (req, task, requestId) => {
  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler + '-memory-inprogress-request',
    functionName: 'inprogress_request'
  };

  logger.debug(fid, `Task --> ${task}. RequestId --> ${requestId}`);

  const record = memory.inprogress_request;

  switch (task) {
    case 'add':
      record.push(requestId);
      break;

    case 'find':
      if (record.indexOf(requestId) > -1) {
        return true;
      } else {
        return false;
      }

    case 'remove':
      const index = record.indexOf(requestId);
      if (index > -1) {
        record.splice(index, 1);
      }
      break;
  }
};
