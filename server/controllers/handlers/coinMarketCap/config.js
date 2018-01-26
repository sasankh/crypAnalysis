module.exports = {
  source: 'coin_market_cap',
  requiredHeaders: {
    coins: [
      '#',
      'Name',  //required for processing
      'Symbol', //required for processing
      'Market Cap',
      'Price',
      'Circulating Supply',
      'Volume (24h)',
      '% 1h',
      '% 24h',
      '% 7d'
    ],
    tokens: [
      '#',
      'Name', //required for processing
      'Platform', //required for processing
      'Market Cap',
      'Price',
      'Circulating Supply',
      'Volume (24h)',
      '% 1h',
      '% 24h',
      '% 7d'
    ]
  },
  correspondingAttribute: {
    Name: 'Name',
    Symbol: 'Symbol',
    Platform: 'Platform'
  },
  historicalData: {
    startDate: '20100428',
    requiredTableHeaders: [
      'Date',
      'Open',
      'High',
      'Low',
      'Close',
      'Volume',
      'Market Cap'
    ]
  },
  graphData: {
    defaultPastEpochDate: process.env.COINMARKETCAP_DEFAULT_PAST_EPOCH_DATE || 1483228800000
  }
};
