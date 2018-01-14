module.exports = {
  home: require(`${__base}/server/controllers/handlers/home`),

  //coinMarketCap
  coinMarketCap_UpdateCryptoList: require(`${__base}/server/controllers/handlers/coinMarketCap/updateCryptoList`),

  //local
  local_UpdateCryptoInfo: require(`${__base}/server/controllers/handlers/local/updateCryptoInfo`)
};
