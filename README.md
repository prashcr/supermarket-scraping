supermarket-scraper
====

> Script that scrapes HK supermarket pricing data and dumps it into MongoDB

Gets data from http://www3.consumer.org.hk/pricewatch/supermarket/index.php?keyword=&lang=en

Examples
----

This is what an example document might look like.

Each document stores product information, and maintains an array of price objects, which are generated each time data is acquired.

```
{
  "_id" : "P000000038",
  "brand" : "Garden",
  "category" : "Cakes",
  "name" : "Chiffon Cake - Chocolate Flavour 60g",
  "prices" : [
    {
      "date" : ISODate("2015-09-27T08:50:58.309Z"),
      "marketplace" : {
        "price" : "6.80",
        "discount" : true
      },
      "parknshop" : {
        "price" : "6.80",
        "discount" : true
      },
      "wellcome" : {
        "price" : "6.80",
        "discount" : true
      }
    }
  ]
}
```

`_id` allows you to look up the product page for an individual product at:
[http://www3.consumer.org.hk/pricewatch/supermarket/detail.php?itemcode=]()`_id`

TODO
----

Consider moving the price data and product data into two seperate collections, so that price data can be queried more efficiently, without a collection scan.

License
----

MIT License © 2015 Prashanth Chandra
