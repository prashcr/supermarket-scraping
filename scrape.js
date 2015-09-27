var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var mongoose = require('mongoose');

var baseUrl = 'http://www3.consumer.org.hk/pricewatch/supermarket/';
var detailUrl = 'detail.php?itemcode=';
var productSchema = new mongoose.Schema({
  _id: String,
  name: String,
  brand: String,
  // Queries will usually be on _id or category
  category: { type: String, index: true },
  prices: [{
    date: { type: Date, default: Date.now },
    wellcome: { price: String, discount: Boolean },
    parknshop: { price: String, discount: Boolean },
    marketplace: { price: String, discount: Boolean },
    aeon: { price: String, discount: Boolean },
    dch: { price: String, discount: Boolean }
  }]
});

var Product = mongoose.model('Product', productSchema);
mongoose.connect('mongodb://localhost/groceries');
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make Sure MongoDB is running.');
});

request(baseUrl + 'index.php?keyword=&lang=en', function(err, res, html) {
  if (!err && res.statusCode == 200) {
    var $ = cheerio.load(html); // Cheerio provides JQuery-like interface to DOM
    console.log('HTML loaded');
    // Get siblings of the table's header row
    var items = $('tr[bgcolor=#FED785]').siblings();
    console.log(items.length +' products parsed');
    // For each item, extract data and upsert
    items.each(function(i, el) {
      var cols = $(el).children();
      var category = $(cols).eq(1);
      var brand = $(cols).eq(2);
      var name = $(cols).eq(3);
      // Store id portion of product url
      var itemcode = name.find('a').attr('href').substring(20);
      var wellcome = $(cols).eq(4);
      var parknshop = $(cols).eq(5);
      var marketplace = $(cols).eq(6);
      var aeon = $(cols).eq(7);
      var dch = $(cols).eq(8);
      // If query matches, update
      // Otherwise, insert document created by combining query and update fields
      // TODO: use async.parallel so we know when all updates have completed
      Product.update(
        {
          _id: itemcode,
          name: name.text(),
          brand: brand.text(),
          category: category.text()
        },
        {
          $push: {
            prices: new Price(wellcome, parknshop, marketplace, aeon, dch)
          }
        },
        {upsert: true},
        function(e) {
          if (e) return console.log(e);
          console.log('upsert '+i+' successful');
        });
    });
  }
});

// Constructor can handle case where all price fields are empty
function Price(wellcome, parknshop, marketplace, aeon, dch) {
  this.wellcome = priceData(wellcome);
  this.parknshop = priceData(parknshop);
  this.marketplace = priceData(marketplace);
  this.aeon = priceData(aeon);
  this.dch = priceData(dch);
  if (!(this.wellcome || this.parknshop || this.marketplace || this.aeon || this.dch)) {
    return undefined; // Mongoose ignores undefined fields
  }
}

// Normalize price data
function priceData (price) {
  if (price.text() == '--') return undefined; // Mongoose ignores undefined fields
  return {
    price: price.text().trim().replace(' ', '').substring(1),
    discount: Boolean(price.find('a').attr('href'))
  };
}