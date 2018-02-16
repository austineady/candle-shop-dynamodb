const Product = require('../models/product');

/**
 * Create Product
 * @description Create a single product with provided name and price.
 * @param {Object} product - { name: String, price: Number }
 */
function createProduct(product) {
  return new Promise(function (resolve, reject) {
    Product.create(product, { overwrite: false }, function (err, result) {
      if (err) return reject(err);
      else return resolve(result);
    });
  });
}

/**
 * Update Product
 * @description Update a single product. Requires a productId
 * @param {Object} product - object containing productId and new data
 * @returns {Function} cb - callback(error, result)
 */
function updateProduct(product) {
  return new Promise(function (resolve, reject) {
    if (!product.productId) return reject({
      message: 'A productId is required to update a product\'s data.'
    });
    const expectations = {
      expected: {
        productId: { Exists: true }
      }
    };
    Product.update(product, expectations, function (err, result) {
      if (err) return reject(err);
      else return resolve(result);
    });
  });
}

function getAllProducts() {
  return new Promise(function (resolve, reject) {
    Product
    .scan()
    .limit(10)
    .exec(function (err, result) {
      if (err) return reject(err);
      else return resolve(result);
    });
  });
}

function getSingleProduct(productId) {
  return new Promise(function (resolve, reject) {
    Product.get(productId, function (err, result) {
      if (err) return reject(err);
      else return resolve(result);
    });
  });
}

function getProductsByName(name, cb) {
  Product
  .query(name)
  .usingIndex('ProductName-index')
  .exec(cb);
}

function getProductsByPrice(comparator, price, cb) {
  Product
  .scan()
  .where('price')[comparator](parseFloat(price))
  .limit(10)
  .exec(cb);
}

function queryProducts(query) {
  return new Promise(function (resolve, reject) {

    function handle (err, result) {
      if (err) return reject(err);
      else return resolve(result);
    }

    if (query.name) {
      getProductsByName(handle);
    } else if (query.price) {
      getProductsByPrice('equals', query.price, handle);
    } else if (query['price>']) {
      getProductsByPrice('gte', query['price>'], handle);
    } else if (query['price<']) {
      getProductsByPrice('lte', query['price<'], handle);
    }
  });
}

function deleteSingleProduct(productId) {
  return new Promise(function (resolve, reject) {
    Product.destroy(productId, function (err) {
      if (err) return reject(err);
      else return resolve(true);
    });
  });
}

module.exports = {
  createProduct,
  updateProduct,
  getAllProducts,
  getSingleProduct,
  queryProducts,
  deleteSingleProduct
};