'use strict';

const config = require(__base + '/server/config/config');

const db = require(__base + '/server/init/mysql');
const logger = require(__base + '/server/utilities/modules/logger');


/**
* queryMysql(Object)
* The function performs mysql query or queries based on the data supplied
* @api public
* @param {Object} dbToUse, query, value
* @return {Response} promise
**/
module.exports.queryMysql = (req, dbToUse, query, post, callback) => {

  const fid = {
    requestId: req.requestId,
    handler: req.passData.handler + '-mysql',
    functionName: 'queryMysql'
  };

  try {
    logger.debug(fid, 'Query --> ' + query + ' . Post --> ' + JSON.stringify(post));
  } catch (e){
    logger.debug(fid, 'Query --> ' + query + ' . Post --> ' + post);
  }

  let database;

  switch(dbToUse){
    case 'db_crypto':
      database = db.db_crypto;
      break;

    default:
      callback({error: { code: 102, message: 'Unhandled dbToUse condition. System does not know what to do', fid: fid, type: 'warn', trace: 'dbToUse is'+dbToUse}}, null);
  }

  database.getConnection(function(err,connection){
    if(err){
      logger.warn(fid, 'Problem getting mysql connection', err);
      callback(err, null);
    }else{
      connection.query({
        sql: query,
        timeout: parseInt(config.mysql.query_timeout)
      }, post,function(err1, result){
        connection.release();
        if(err1){
          logger.warn(fid, 'Problem performing the sql query', err1);
          callback(err1, null);
        }else{
          callback(null, result);
        }
      });
    }
  });
};


/**
* queryMysqlDb(Object)
* The function performs the mysql escape
**/
module.exports.mysqlEscape = (value) => {

  return db.mysql.escape(String(value));

};
