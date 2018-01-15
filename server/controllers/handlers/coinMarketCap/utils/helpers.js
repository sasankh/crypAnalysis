'use strict';

module.exports.getPlatformCryptoSymbol = (name, symbol, type) => {
  let platformSymbol = name.toLowerCase();

  platformSymbol = platformSymbol.replace(new RegExp(' ', 'g'), '-');

  return platformSymbol;
};
