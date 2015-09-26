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
    var $ = cheerio.load(html);
    // Get siblings of the table's header row
    var items = $('tr[bgcolor=#FED785]').siblings();
    items.each(function(i, el) {
      var cols = $(el).children();
      var category = $(cols).eq(1);
      var brand = $(cols).eq(2);
      var name = $(cols).eq(3);
      var itemcode = name.find('a').attr('href').substring(20);
      var wellcome = $(cols).eq(4);
      var parknshop = $(cols).eq(5);
      var marketplace = $(cols).eq(6);
      var aeon = $(cols).eq(7);
      var dch = $(cols).eq(8);
      var product = new Product({
        _id: itemcode,
        name: name.text(),
        brand: brand.text(),
        category: category.text()
      });
      Product.update(
        product.toObject(),
        {
          $push: {
            prices: {
              wellcome: priceData(wellcome),
              parknshop: priceData(parknshop),
              marketplace: priceData(marketplace),
              aeon: priceData(aeon),
              dch: priceData(dch)
            }
          }
        },
        {upsert: true},
        function(e) {if (e) console.log(e);});
    });
  }
});

// Normalize price data
function priceData (price) {
  if (price.text() == '--') return undefined;
  return {
    price: price.text().trim().replace(' ', '').substring(1),
    discount: Boolean(price.find('a').attr('href'))
  };
}