## Candle Shop - DynamoDB Backend

### Installation
Core Dependencies:

```
aws-sdk
express
body-parser
```

#### Cloned Projects

```
$ npm install
```

#### From Scratch

Create the project repo, create main JS file, initialize `npm`, and install dependencies:

```
$ mkdir candle-shop && cd candle-shop
$ touch server.js
$ npm init -y
$ npm install --save express@4.16.2 body-parser@1.18.2 aws-sdk@2.188.0
```

A DynamoDB database will need to be downloaded to develop locally. Downloads can be found [here](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html).

### First Steps
The DynamoDB interface is actually a method on the `AWS` object imported from `aws-sdk` and it requires some configuration settings to initialize.

If it's stated in their documentation, I didn't find it, but for local development any string can be used for `accessKeyId` and `secretAccessKey`. Their documentation will point you to their IAM console where you create these keys for registered users and it quickly gets complicated. Just pass through any string until you need to hook up your project to Amazon servers.
```
// start up a local DB
const AWS = require('aws-sdk');
// ...
const dynamo = new AWS.DynamoDB({
  accessKeyId: 'myKeyId',
  secretAccessKey: 'secretKey',
  region: 'us-east-1',
  endpoint: 'http://localhost:8000' // port 8000 is DynamoDB's default port
});
```

Next, some Express scaffolding
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

The primary identifier, `productId`, will be used to make each product unique, meaning 
that two products can have the same `name`, but not the same `productId`.

For the time being, the table will look like this:
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

[More on Tables and Hash Keys](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html)

### Creating Tables
Tables are created using `dynamo.createTable`, which takes two paramters: The table schema and a callback function.
```
// First import the table schema
const ProductsTable = require('./tables/Products');
// ....
dynamo.createTable(ProductsTable, function (error, data) {
  if (error) return console.log('Error: There was a problem creating the Products table', error);
  console.log('Products table created');
  console.log(JSON.stringify(data, null, 2));
});
```

During development, I was repeatedly restarting the database server after editing table or model schema. That means that the tables repeatedly needed to be created. Additionally, anytime I restarted my non-database server script, it would try to re-create the table. If the table already existed, dynamo would throw an error. I ended up wrapping my table creation logic with `dynamo.listTables`, which would check if the table already existed first.

`dynamo.listTables` takes two parameters. The first is an options object where you can specify limits, filters, etc. The second is a callback function. Since there's only one table, I passed through an empty object as seen in their documentation examples.

```
const ProductsTable = require('./tables/Products');

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

### Creating Models / Schema
Once I could see the tables being created correctly, I wanted to try saving some data to them.

To keep things organized, I created a folder named `models` and added the file `Product.js` to it.

In this file, I imported the `node-uuid` module and exported out a constructor function returning an object ready to be saved to DynamoDB.

```
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
```

Anytime a new product is added, the `name` and `price` will need to be passed through. `createdAt` and `updatedAt` were added to have access to timestamps later on.

Back in `server.js`, import the Product constructor.

```
dynamo.listTables({}, function (error, response) {
  // ....
}

const Product = require('./models/Product');
```

### Adding Items

Managing items with DynamoDB is easiest through the `DocumentClient`, which is a method on the `AWS.DynamoDB` object. The `DocumentClient` needs to be initialized similar to the `AWS.DynamoDB` instance. The method accepts an options object, where you can specify which `AWS.DynamoDB` instance you are working with.

```
const Product = require('./models/Product');

const client = new AWS.DynamoDB.DocumentClient({
  service: dynamo, // the dynamoDB instance variable
  convertEmptyValues: true
});
```

`convertEmptyValues` will simply convert empty strings or objects to `NULL`, which is not desired in all cases but was set here to find any errors easier later on.

The method to add items with the `DocumentClient` or now `client` is `.put({...})`. Since the `Product` constructor already returns data in the correct format for `put()`, it just needs to be called with a new `Product` and a callback function.

```
const product = Product('Autumn Breeze', 12.99);

client.put(product, function (error) {
  if (error) return console.log(`Error: Unable to create ${product.Item.name}`);
  console.log(`Created a Product: ${product.Item.name}`);
});
```

Because products are identified by their `productId` and not their `name`, each time you restart your server (not your db), another product named "Autum Breeze" with a price of $12.99 will be created.

Once successfully adding items, I created a folder named `controllers` and created `products.js` inside. The purpose of this folder is to house all of the product management functionality so that `server.js` can focus on handling routes and delegating.

```
// controllers/products.js

module.exports = function ProductsController (client) {
  saveProduct(product, cb) {
    client.put(product, function (error, data) {
      if (error) return console.log(Error: Unable to create ${product.Item.name}`);
      console.log(`Created a Product: ${product.Item.name}`);
      if (cb) cb(error, product.Item);
    });
  }
}
```

And then require and instantiate it from `server.js`:

```
const Product = require('./models/Product');
const ProductsController = require('./controllers/products');
const productsCtrl = ProductsController(client);

const product = Product('Autumn Breeze', 12.99);

productsCtrl.saveProduct(product); // can pass cb if needed
```

### Setting Up API

Keeping all of these actions predefined in a single script is limiting. With some simple express routes, some API endpoints can be created. Still keeping it simple, the immensely useful [Postman](https://www.getpostman.com/) desktop application will be used to make these HTTP requests.

The creation of products functionality will be first. Following REST principles, the route to create new products will be a POST request to `http://localhost:3000/products`. The route will accept a `Content-Type` of `application/json` and will require a product `name` and `price` be present in the body.

[Express Documentation](https://expressjs.com/en/guide/routing.html)

```
const Product = require('./models/Product');
const ProductsController = require('./controllers/products');
const productsCtrl = ProductsController(client);

// REMOVE const product = Product('Autumn Breeze', 12.99);

// REMOVE productsCtrl.saveProduct(product);

app.post('/products', function (req, res) {
  const name = req.body.name;
  const price = req.body.price;

  if (name && price) {
    const newProduct = Product(name, price);
    productsCtrl.saveProduct(newProduct, function (err, result) {
      if (err) {
        return res.status(400).end(`There was a problem creating Product: ${name}.`);
      } else {
        return res.status(200).json(result);
      }
    });
  } else {
    return res.status(400).end('/products POST endpoint requires a product name and price');
  }
});
```

### Using Postman

Open Postman and enter `http://localhost:3000/products` into the address bar. On the left side of the address bar, select `POST` instead of `GET`. Underneath the address bar, click the Headers tab. The first key field will be `Content-Type` and it's value will be `application/json`. Click the Body tab and select the "raw" radio button. Select "JSON (application/json)" from the dropdown on the right.

In the textarea below the radio buttons, make an object with a name and price property:

```
{
  "name": "Spring Showers",
  "price": 8.99
}
```

Make sure the DynamoDB server and the Express server are running and click Send.

