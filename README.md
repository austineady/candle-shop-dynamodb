## Candle Shop - DynamoDB Backend

### Installation
Core Dependencies:

```
aws-sdk
express
body-barser

```

Either download DynamoDB directly or download a Docker image to start up the DB

### First Steps
The DynamoDB interface is actually a property on the `AWS` object imported from `aws-sdk`.
```
// start up a local DB
const AWS = require('aws-sdk');
// ...
// accessKeyId and secretAccessKey can be any string
// until you are ready to connect to your AWS account
// region needs to be specified from a specific list
// endpoint needs to be pointed at the running DB,
// port 8000 is DynamoDB's default port
const dynamo = new AWS.DynamoDB({
  accessKeyId: 'myKeyId',
  secretAccessKey: 'secretKey',
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});
```

Next, write out some Express scaffolding
```
const express = require('express');
const bodyParser = require('body-parser');
// ...
const PORT = 3000;
const app = express();
app.use(bodyParser.json()); // tell express to use body-parser

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
```

### Setting up Tables
I created a separate folder named `tables/` and created a file named `Products.js`.

To start off, a single product will have:
- productId { String }
- name { String }
- price { Number }

Our primary identifier, `productId`, will be used to make each product unique, meaning 
that two products can have the same `name`, but not the same `productId`.

For the time being, our table will look like this:
```
// tables/Products.js
// ------------------------
module.exports = {
  TableName: 'Products',
  KeySchema: [{
    AttributeName: 'productId',
    KeyType: 'HASH'
  }],
  AttributeDefinitions: [{
    AttributeName: 'productId',
    AttributeType: 'S'
  }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
};
```

Since `productId` is our `Hash Key`, Dynamo will require it anytime it needs to isolate a single product.
`AttributeDefinitions` simply defines `productId` as a `String`. `ProvisionedThroughput` is used to manage
database read/write rates/limits.

### Creating Tables
Tables are created using `dynamo.createTable`, which takes two paramters: The table schema and a callback function.
```
import ProductsTable from './tables/Products';
// ....
dynamo.createTable(ProductsTable, function (error, data) {
  if (error) return console.log('Error: There was a problem creating the Products table', error);
  console.log('Products table created');
  console.log(JSON.stringify(data, null, 2));
});
```
> Some people might ask why I don't use `console.error` and instead pass through a string starting with 'Error:...'. Console.error looks identical to actual errors, which makes them hard to find if a lot of errors are thrown at once. This way, I know explicitly what and where something went wrong.

During development, I was repeatedly restarting the database server after editing table or model schema. That means that the tables repeatedly needed to be created. Additionally, anytime I restarted my non-database server script, it would try to re-create the table. If the table already existed, dynamo would throw an error. I ended up wrapping my table creation logic with `dynamo.listTables`, which would check if the table already existed first.

`dynamo.listTables` takes two parameters. The first is an options object where you can specify a limits, filters, etc. The second is a callback function. Since I only had one table, I passed through an empty object as per their documentation examples.

```
dynamo.listTables({}, function (error, response) {
  if (error) return console.log('Error: Unable to list tables', error);
  // check response for table name
  if (!response.TableNames || !response.TableNames.includes('Products')) {
    // table doesn't exist, notify and create one
    console.log('Tables not found, creating them...');
    dynamo.createTable(...); // same function as before
  }
  // table does exist, do nothing
});
```

`response.TableNames` will be null if no tables exist. `response.TableNames.includes('Products')` checks the returned array for the specific table name to future proof for any additional tables added in the future.