const uuid = require('node-uuid');

module.exports = function (name, price) {
  return {
    TableName: 'Products',
    Item: {
      productId: uuid.v4(),
      price,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
};