module.exports = {
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
  }
};
