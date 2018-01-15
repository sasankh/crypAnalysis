'use strict';
const RateLimiter = require('limiter').RateLimiter;

const config = require(__base + '/server/config/config');
const logger = require(__base + '/server/init/logger').main;

let coin_market_cap_limiter;

function initializeLimiters(){

  logger.debug('[INITIALIZATION]: initializeLimiters --> Initializing');

  coin_market_cap_limiter = new RateLimiter(parseInt(config.limiter.coin_market_cap_limiter.limit), parseInt(config.limiter.coin_market_cap_limiter.unit));
}

initializeLimiters();

module.exports = {
  coin_market_cap_limiter
};
