'use strict';

const { logger } = require(`${__base}/server/utilities/utils`);

/* cryptoNameErrorChecker --> returns 'true' if error present or exception occurs else 'false' */
module.exports.cryptoNameErrorChecker = (req, symbol, name) => {
  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler,
    functionName: 'getTableFromHtml'
  };

  try{
    let errorCount = 0;

    const needAttentionIfPresent = [
      '.',
      '[',
      ']',
      '(',
      ')',
      '/',
      '\\'
    ];

    for (let x = 0; x < needAttentionIfPresent.length; x++) {
      if (name.includes(needAttentionIfPresent[x])) {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      logger.debug(fid, `invoked with symbol: ${symbol} and name: ${name}`);
      return true;  //there is name error
    } else {
      return false;  //terhe is no name error
    }

  } catch (e) {
    logger.debug(fid, `Problem finding name error in symbol: ${symbol} and name: ${name}`, e);
    return true; //problem determining need attention
  }
};
