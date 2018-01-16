'use strict';

const ROUTES = {

  //POST

  //GET
  home: '/',
  coinMarketCap_UpdateCryptoList: '/crypto/coin_market_cap/update/:type',
  coinMarketCap_UpdateCryptoDataSource: '/crypto/coin_market_cap/data_source/update_all',
  coinMarketCap_ScrapAllHistoricalData: '/crypto/coin_market_cap/scrap_all_historical_data',
  getRequestStatus: '/crypto/request/status/:requestId',

  //PUT
  updateCryptoInfo: '/crypto/info/update',
  updateCryptoDataSourceRecord: '/crypto/data_source/update',

  //PATCH

  //DEL

  //OPTION

};

module.exports = ROUTES;
