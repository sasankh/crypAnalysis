'use strict';
const mysql  = require('mysql');
const uuidv5 = require('uuid/v5');
const asyncLab = require('async');
const fs = require('fs');

const dev_env = require('../credentials').dev_env;

const db_crypto = mysql.createPool({
  host     : dev_env.CRYPTO_MYSQL_HOST,
  user     : dev_env.CRYPTO_MYSQL_USER,
  password : dev_env.CRYPTO_MYSQL_PASS,
  database : dev_env.CRYPTO_MYSQL_DB,
  port : dev_env.CRYPTO_MYSQL_PORT,
  connectionLimit: parseInt(dev_env.CRYPTO_MAX_MYSQL_CONNECTION),
  waitForConnections: true,
  multipleStatements : true
});


async function getNullRecords (type) {
  return new Promise ((resolve, reject) => {
    console.log('getNullRecords --> invoked')

    const nullBtc = {
      query: `SELECT * FROM crypto.price_data_epoch where price_btc IS NULL AND price_usd IS NOT NULL AND request_type = 'all';`,
      post: []
    }

    const nullUsd = {
      query: `SELECT * FROM crypto.price_data_epoch where price_btc IS NOT NULL AND price_usd IS NULL AND request_type = 'all';`,
      post: []
    }

    let query = {};

    switch (type) {
      case 'nullBtc':
      query = nullBtc;
      break;
      case 'nullUsd':
      query = nullUsd;
      break;
    }

    async function queryFunction () {
      const result = await queryInDb(query);
      console.log('result --> ' + result.length)

      resolve(result);
    }

    queryFunction();
  });
}

function queryInDb (query) {
  return new Promise ((resolve, reject) => {
    console.log('queryInDb --> invoked');
    db_crypto.getConnection(function(err,connection){
      if(err){
        console.error('Problem getting mysql connection', err);
        reject('Problem getting mysql connection');
      }else{
        console.log('queryInDb --> query in progress')
        connection.query({
          sql: query.query,
          timeout: parseInt(dev_env.QUERY_TIMEOUT)
        }, query.post,function(err1, result){
          connection.release();
          if(err1){
            console.error('Problem performing the sql query', err1);
            reject('Problem performing the sql query')
          }else{
            console.log('queryInDb --> Query completed')
            resolve(result);
          }
        });
      }
    });
  });
}

/*
id: '00030b85-e668-56ad-86fa-1b0bff88c552',
crypto_id: 'a1c61d20-146e-5210-b595-afcfddaac644',
source: 'coin_market_cap',
created_at: 2018-01-25T21:46:21.000Z,
updated_at: 2018-01-25T21:46:21.000Z,
epoch_date: 1513981463000,
price_usd: 0.0179606,
price_btc: null,
request_type: 'all' },
*/

const getPosts = (attribute, records) => {
  return new Promise ((resolve, reject) => {
    console.log('Performing post processing');
    const total = records.length;

    const tmpRecords = [
      records[0],
      records[1]
    ];

     //const post = tmpRecords.map((data, index) => {
     const post = records.map((data, index) => {
      console.log(`${index} / ${total}`);

      return [
        uuidv5(data.crypto_id, uuidv5(`coin_market_cap-all-${data.epoch_date}`, uuidv5.URL)),
        data.crypto_id,
        data.source,
        data.request_type,
        data.epoch_date,
        data[attribute]
      ];
    });

    resolve(post);
  });
}

async function fixPriceUsdDataDuplication () {
  try {
    console.log('fixPriceUsdDataDuplication --> invoked')

    let usdRecords = await getNullRecords('nullBtc');

    const query = {
      query: 'INSERT INTO price_data_epoch (id, crypto_id, source, request_type, epoch_date, price_usd) VALUES ? ON DUPLICATE KEY UPDATE price_usd=VALUES(price_usd)',
      post: [await getPosts('price_usd', usdRecords)]
    };

    const insertResult = await queryInDb(query);
    console.log('fixPriceUsdDataDuplication --> Insert complete ', insertResult);

  }catch(e) {
    console.error('Catch Error')
    console.error(e)
  }

}

async function fixPriceBtcDataDuplication () {
  try {
    console.log('fixPriceBtcDataDuplication --> invoked')

    const btcRecords = await getNullRecords('nullUsd');

    const query = {
      query: 'INSERT INTO price_data_epoch (id, crypto_id, source, request_type, epoch_date, price_btc) VALUES ? ON DUPLICATE KEY UPDATE price_btc=VALUES(price_btc)',
      post: [await getPosts('price_btc', btcRecords)]
    };

    const insertResult = await queryInDb(query);
    console.log('fixPriceBtcDataDuplication --> Insert complete ', insertResult);
  }catch(e) {
    console.error('Catch Error')
    console.error(e)
  }
}

async function createUsdJsonFile () {
  try {
    console.log('createUsdJsonFile --> invoked');

    const query = {
      query: 'INSERT INTO price_data_epoch (id, crypto_id, source, request_type, epoch_date, price_usd) VALUES ? ON DUPLICATE KEY UPDATE price_usd=VALUES(price_usd)',
      post: [await getPosts('price_usd', await getNullRecords('nullBtc'))]
    };

    fs.writeFile("./price_usd.json", JSON.stringify(query), function(err) {
      if(err) {
        console.error(err);
      } else {
        console.log('Saved price usd json')
      }
    });
  }catch(e) {
    console.error('Catch Error price usd')
    console.error(e)
  }

}

async function createBtcJsonFile () {
  try {
    console.log('createBtcJsonFile --> invoked');

    const query = {
      query: 'INSERT INTO price_data_epoch (id, crypto_id, source, request_type, epoch_date, price_btc) VALUES ? ON DUPLICATE KEY UPDATE price_btc=VALUES(price_btc)',
      post: [await getPosts('price_btc', await getNullRecords('nullUsd'))]
    };

    fs.writeFile("./price_btc.json", JSON.stringify(query), function(err) {
      if(err) {
        console.error(err);
      } else {
        console.log('Saved price btc json')
      }
    });
  }catch(e) {
    console.error('Catch Error price btc')
    console.error(e)
  }

}


async function insertData () {
  try {
    console.log('insertData --> invoked')

    //const query = require('./price_usd.json')
    //const insertResult = await queryInDb(query);

    const query = require('./price_btc.json')
    // const insertResult = await queryInDb(query);
    var x = 0;

    asyncLab.mapSeries(query.post[0], (data, callback) => {
      console.log(x++);
      const executeQuery = {
        query: query.query,
        post: [[data]]
      };

      queryInDb(executeQuery)
      .then((response) => {
        console.log(x);
        callback(null, true);
      })
      .catch((err) => {
        callback('Problem with insertions')
      })
    }, (err, result) => {
      console.log('insertData --> Insert complete ');
    });

  }catch(e) {
    console.error('Catch Error')
    console.error(e)
  }

}

insertData();





//fixPriceUsdDataDuplication();
//fixPriceBtcDataDuplication();
//createUsdJsonFile();
//createBtcJsonFile();
