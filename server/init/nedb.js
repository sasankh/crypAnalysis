'use strict';
const NeDB  = require('nedb');

const config = require(__base + '/server/config/config');
const logger = require(__base + '/server/init/logger').main;

let db_memory_inprogress;

function initializeNeDb(){
  logger.debug('[INITIALIZATION]: initializeNeDb --> Initializing');

  db_memory_inprogress = new NeDB();
}

initializeNeDb();

module.exports = {
  db_memory_inprogress
};
