const dynogels = require('../db/dynogels');
const Joi = require('joi');

module.exports = dynogels.define('Product', {
  hashKey: 'productId',
  timestamps: true,
  schema: {
    productId: dynogels.types.uuid(),
    name: Joi.string(),
    price: Joi.number()
  },
  indexes : [{
    hashKey : 'name', rangeKey : 'productId', name : 'ProductName-index', type : 'global'
  }]
});