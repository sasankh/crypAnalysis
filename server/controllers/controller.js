module.exports = {
  home: require(`${__base}/server/controllers/handlers/home`),

  //coinMarketCap
  coinMarketCap_UpdateCryptoList: require(`${__base}/server/controllers/handlers/coinMarketCap/updateCryptoList`),
  coinMarketCap_UpdateCryptoDataSource: require(`${__base}/server/controllers/handlers/coinMarketCap/handlers`).updateCryptoDataSourceHandler,
  coinMarketCap_ScrapAllHistoricalData: require(`${__base}/server/controllers/handlers/coinMarketCap/handlers`).coinMarketCap_ScrapAllHistoricalDataHandler,
  coinMarketCap_GraphDataUpdate: require(`${__base}/server/controllers/handlers/coinMarketCap/handlers`).coinMarketCap_GraphDataUpdate,

  //local
  local_UpdateCryptoInfo: require(`${__base}/server/controllers/handlers/local/updateCryptoInfo`),
  local_UpdateCryptoDataSourceRecord: require(`${__base}/server/controllers/handlers/local/updateCryptoDataSourceRecord`),
  local_GetRequestStatus: require(`${__base}/server/controllers/handlers/local/getRequestStatus`)
};
