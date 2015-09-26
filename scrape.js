var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var baseUrl = 'http://www3.consumer.org.hk/pricewatch/supermarket/';

request(baseUrl + 'index.php?keyword=&lang=en', function(err, res, html) {
  if (!err && res.statusCode == 200) {
    var $ = cheerio.load(html);
    var parsedResults = [];
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
      parsedResults.push({
        url: baseUrl + product.find('a').attr('href') + '&lang=en',
        category: category.text(),
        brand: brand.text(),
        product: product.text(),
        wellcome: priceData(wellcome),
        parknshop: priceData(parknshop),
        marketplace: priceData(marketplace),
        aeon: priceData(aeon),
        dch: priceData(dch)
      });
    });
    fs.writeFile('prices.json', JSON.stringify(parsedResults), function(err) {
      if (err) return console.log(err);
      console.log(parsedResults.length+' documents were dumped successfully');
    })
  }
});

// Normalize price data
function priceData (price) {
  if (price.text() == '--') return null;
  return {
    price: price.text().trim().replace(' ', ''),
    discount: Boolean(price.find('a').attr('href'))
  };
}
