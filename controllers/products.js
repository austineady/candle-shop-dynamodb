module.exports = function ProductsController(client) {
  return {
    getProductByName(name, cb) {
      const params = {
        TableName: 'Products', // required
        IndexName: 'ProductName-index',
        KeyConditions: {
          name: {
            ComparisonOperator: 'EQ',
            AttributeValueList: [name]
          }
        }
      };
      client.query(params, function (error, data) {
        if (error) {
          cb({
            message: 'Error getting product',
            error
          });
        }
        cb(null, data);
      });
    },
    
    getSingleProduct(productId, cb) {
      const params = {
        TableName: 'Products', // required
        Key: {
          productId
        }
      };
      client.get(params, function (error, data) {
        if (error) cb({ message: 'Error getting product', error });
        cb(null, data);
      });
    },
    
    getAllProducts(cb) {
      const params = {
        TableName: 'Products', // required
        Limit: 15 // or 1MB whichever happens first
      };
    
      const productList = [];
    
      client.scan(params).eachPage(function (error, data) {
        if (error) {
          cb({ message: 'Error while Scanning', error });
        } else if (data) {
          for (let i = 0; i < data.Items.length; i++) {
            productList.push(data.Items[i]);
          }
        } else {
          cb(null, productList);
        }
      });
    },
    
    updateProduct(newProductData, cb) {
      if (!newProductData.name && !newProductData.price) {
        return cb(null, newProductData);
      }
      const params = {
        TableName: 'Products',
        Key: {
          productId: newProductData.productId,
        },
        AttributeUpdates: {
          updatedAt: {
            Action: 'PUT',
            Value: new Date().toISOString()
          }
        }
      };
      if (newProductData.name) {
        params.AttributeUpdates.name = {
          Action: 'PUT',
          Value: newProductData.name
        };
      }
      if (newProductData.price) {
        params.AttributeUpdates.price = {
          Action: 'PUT',
          Value: newProductData.price
        };
      }
      client.update(params, function (error, data) {
        if (error) return cb(error);
        cb(null, newProductData);
      });
    },
    
    saveSingleProduct(product, cb) {
      client.put(product, function (error, data) {
        if (error) return console.log(`ERROR: Unable to create ${product.Item.name}`);
        console.log(`Created a Product: ${product.Item.name}`);
        if (cb) cb(error, product.Item);
      });
    },
    
    saveProducts(products, cb) {
      const params = {
        RequestItems: {
          Products: []
        }
      };
      products.forEach(function (product) {
        params.RequestItems.Products.push({
          PutRequest: {
            Item: product.Item
          }
        });
      });
      client.batchWrite(params, function (error, data) {
        if (error) return cb({
          message: 'There was a problem creating the new products',
          error
        });
        console.log(`Created ${params.RequestItems.Products.length} products.`);
        return cb(error, data);
      });
    }
  }
};