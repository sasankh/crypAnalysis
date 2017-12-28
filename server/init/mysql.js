'use strict';
const mysql  = require('mysql');

const config = require(__base + '/server/config/config');
const logger = require(__base + '/server/init/logger').main;

let db_crypto;

function initializeMysql(){

  logger.debug('[INITIALIZATION]: initializeMysql --> Initializing');

  db_crypto = mysql.createPool({
    host     : config.mysql.db_crypto.host,
    user     : config.mysql.db_crypto.user,
    password : config.mysql.db_crypto.password,
    database : config.mysql.db_crypto.database,
    port : config.mysql.db_crypto.port,
    connectionLimit: parseInt(config.mysql.db_crypto.max_connection),
    waitForConnections: true,
    multipleStatements : true
  });

}

initializeMysql();

module.exports = {
  mysql: mysql,
  db_crypto: db_crypto
};
