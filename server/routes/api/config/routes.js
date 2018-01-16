'use strict';

const ROUTES = {

  //POST

  //GET
  home: '/',
  coinMarketCap_UpdateCryptoList: '/crypto/coin_market_cap/update/:type',
  coinMarketCap_UpdateCryptoDataSource: '/crypto/coin_market_cap/data_source/update_all',
  coinMarketCap_GetHistoricalData: '/crypto/coin_market_cap/historical_data/:crypto_id',
  getRequestStatus: '/crypto/request/status/:requestId',

  //PUT
  updateCryptoInfo: '/crypto/info/update',
  updateCryptoDataSourceRecord: '/crypto/data_source/update',

  //PATCH

  //DEL

  //OPTION

};

module.exports = ROUTES;
