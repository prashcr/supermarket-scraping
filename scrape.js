var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var mongoose = require('mongoose');

var baseUrl = 'http://www3.consumer.org.hk/pricewatch/supermarket/';
var mongodbUrl = 'mongodb://localhost/groceries';

request(baseUrl + 'index.php?keyword=&lang=en', function(err, res, html) {
  if (!err && res.statusCode == 200) {
    var $ = cheerio.load(html);
    // Get siblings of the header row of the table
    var items = $('tr[bgcolor=#FED785]').siblings();
    items.each(function(i, el) {
      var cols = $(el).children();
      // Get every column, except the first and last
      var category = $(cols).eq(1);
      var brand = $(cols).eq(2);
      var product = $(cols).eq(3);
      var wellcome = $(cols).eq(4);
      var parknshop = $(cols).eq(5);
      var marketplace = $(cols).eq(6);
      var aeon = $(cols).eq(7);
      var dch = $(cols).eq(8);
      var url = product.find('a').attr('href');
    });
  }
});

// Normalize price data
function priceData (price) {
  if (price.text() == '--') return null;
  return {
    price: price.text().trim().replace(' ', '').substring(1),
    discount: Boolean(price.find('a').attr('href'))
  };
}
