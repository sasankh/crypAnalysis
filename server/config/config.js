'use strict';

exports.app = {
  application: 'CRYP_ANALYSIS',
  environment: process.env.ENVIRONMENT,
  port: process.env.PORT,
  cryptoKey: process.env.CRYPTOKEY,
  timeout: process.env.REQUEST_TIMEOUT || 60000,
  downloadPath :global.__base+'/server/downloads/'
};

exports.mysql = {
  query_timeout: process.env.QUERY_TIMEOUT || 300000,
  db_crypto: {
    host: process.env.CRYPTO_MYSQL_HOST,
    user: process.env.CRYPTO_MYSQL_USER,
    password: process.env.CRYPTO_MYSQL_PASS,
    database: process.env.CRYPTO_MYSQL_DB,
    port: process.env.CRYPTO_MYSQL_PORT,
    max_connection: process.env.CRYPTO_MAX_MYSQL_CONNECTION || 6
  }
};

exports.credentials = {
};

exports.apis = {
  coin_market_cap: {
    base_url: 'https://coinmarketcap.com',
    api: {
      all_crypto: '/all/views/all/',
      all_coin: '/coins/views/all/',
      all_token: '/tokens/views/all/'
    }
  }
};

exports.log = {
  log_level: process.env.MAIN_LOG_LEVEL,
  log_path: process.env.LOG_PATH
};
