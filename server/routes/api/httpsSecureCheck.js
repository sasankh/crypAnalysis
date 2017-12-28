'use strict';

const config = require(`${__base}/server/config/config`);
const { logger } = require(`${__base}/server/utilities/utils`);

/**
  * authCheck (Object)
**/
module.exports.secureCheck = (req, res, next) => {

  const fid = {
    requestId: req.requestId,
    handler: 'secureCheck',
    functionName: 'secureCheck'
  };

  logger.debug(fid,'invoked');

  const environments = ['stage', 'prod'];

  if(environments.includes(config.app.environment)){
    if(req.secure === true && req.protocol === 'https'){
      logger.debug(fid,'Secure protocol successfully validated.');
      return next();
    }
    else{
      logger.warn(fid,'Not a secure login request. Request is not https');
      res.status(400).send({
        error:{
          success: false,
          message: 'Not a secure request'
        }
      });
    }
  }
  else{
    return next();
  }
};
