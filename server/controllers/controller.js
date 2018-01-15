module.exports = {
  home: require(`${__base}/server/controllers/handlers/home`),

  //coinMarketCap
  coinMarketCap_UpdateCryptoList: require(`${__base}/server/controllers/handlers/coinMarketCap/updateCryptoList`),
  coinMarketCap_UpdateCryptoDataSource: require(`${__base}/server/controllers/handlers/coinMarketCap/handlers`).updateCryptoDataSourceHandler,

  //local
  local_UpdateCryptoInfo: require(`${__base}/server/controllers/handlers/local/updateCryptoInfo`)
};
