'use strict';

const ROUTES = {

  //POST

  //GET
  home: '/',
  coinMarketCap_UpdateCryptoList: '/crypto/coin_market_cap/update/:type',
  coinMarketCap_UpdateCryptoDataSource: '/crypto/coin_market_cap/data_source/update_all',

  //PUT
  updateCryptoInfo: '/crypto/info/update',

  //PATCH

  //DEL

  //OPTION

};

module.exports = ROUTES;
