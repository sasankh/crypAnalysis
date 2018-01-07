'use strict';

const tabletojson = require("tabletojson");

const config = require(`${__base}/server/config/config`);
const { logger } = require(`${__base}/server/utilities/utils`);

module.exports.getTableFromHtml = (req, url, callback) => {
  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'getTableFromHtml'
  };

  logger.debug(fid, `invoked with URL: ${url}`);

  try{
    tabletojson.convertUrl(url, (data) => {
      if (data && data.constructor === Array) {
        logger.debug(fid, 'Successfully retrieved tables from website');
        callback(null, data);
      } else {
        logger.warn(fid, 'Retrieved data is undefined or not an array', data);
        callback('Retrieved data is undefined or not an array');
      }
    });
  } catch (e) {
    logger.warn(fid, 'Error retrieving tables from website', e);
    callback('Error retrieving tables from website');
  }
};
