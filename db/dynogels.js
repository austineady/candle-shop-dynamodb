// import dynogels
const dynogels = require('dynogels');
// Set Up Configuration
dynogels.AWS.config.update({
  accessKeyId: 'AKID',
  secretAccessKey: 'SECRET',
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});
// export configured dynogels
module.exports = dynogels;