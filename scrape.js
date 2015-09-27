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
  prices: [new mongoose.Schema({
    date: Date,
    wellcome: { price: String, discount: Boolean },
    parknshop: { price: String, discount: Boolean },
    marketplace: { price: String, discount: Boolean },
    aeon: { price: String, discount: Boolean },
    dch: { price: String, discount: Boolean }
  }, {_id: false})]
});

var Product = mongoose.model('Product', productSchema);
mongoose.connect('mongodb://localhost/groceries');
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make Sure MongoDB is running.');
});
mongoose.connection.on('open', function() {
  console.log('Connected to MongoDB successfully.')
});

var timerId = setInterval(main, 20000);

// Extract data and push it to MongoDB
function main() {
  request(baseUrl + 'index.php?keyword=&lang=en', function(err, res, html) {
    if (!err && res.statusCode == 200) {
      var $ = cheerio.load(html);
      console.log('Loaded HTML');
      // Get siblings of the table's header row
      var items = $('tr[bgcolor=#FED785]').siblings();
      console.log('Parsed '+items.length+' products');
      var tasks = []; // Collect updates for async.parallel
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
        var price = Price(wellcome, parknshop, marketplace, aeon, dch);
        if (price) {
          tasks.push(function(callback) {
            Product.update(
            {
              _id: itemcode,
              name: name.text(),
              brand: brand.text(),
              category: category.text()
            },
            {
              $push: {
                prices: price
              }
            },
            {upsert: true},
            function(e, res) {
              if (e) return console.log(e);
              callback(null, res);
            });
          });
        }
      });
      async.parallel(
        tasks,
        function(err, results) {
          console.log('Upserted '+results.length+' products');
        });
    }
  });
}

// XXX: Custom factory for price schema instead of Mongoose Model
function Price(wellcome, parknshop, marketplace, aeon, dch) {
  wellcome = normalizePriceData(wellcome);
  parknshop = normalizePriceData(parknshop);
  marketplace = normalizePriceData(marketplace);
  aeon = normalizePriceData(aeon);
  dch = normalizePriceData(dch);
  if (!(wellcome || parknshop || marketplace || aeon || dch)) {
    return undefined;
  }
  return {
    date: Date.now(),
    wellcome: wellcome,
    parknshop: parknshop,
    marketplace: marketplace,
    aeon: aeon,
    dch: dch
  };
}

function normalizePriceData (price) {
  if (price.text() == '--') return undefined; // Mongoose ignores undefined fields
  return {
    price: price.text().trim().replace(' ', '').substring(1),
    discount: Boolean(price.find('a').attr('href'))
  };
}