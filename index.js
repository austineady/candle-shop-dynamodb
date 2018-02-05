const dynamo = require('dynamodb');

dynamo.AWS.config.update({
  accessKeyId: 'myKeyId',
  secretAccessKey: 'secretKey',
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});

module.exports = dynamo;

