const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB({
  accessKeyId: 'myKeyId',
  secretAccessKey: 'secretKey',
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});

const ProductsTable = require('./tables/Products');

const PORT = 8080;
const app = express();

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

dynamo.listTables({}, function (error, response) {
  if (error) return console.log('ERROR: Unable to List Tables', error);
  if (!response.TableNames || !response.TableNames.includes('Products')) {
    console.log('Tables not found, creating them...');
    // Table doesn't exist, create it
    dynamo.createTable(ProductsTable, function (error, data) {
      if (error) return console.log('ERROR: There was an error creating the Products table', error);
      console.log('Products table created.');
      console.log(JSON.stringify(data, null, 2));
    });
  }
});

const client = new AWS.DynamoDB.DocumentClient({
  service: dynamo,
  convertEmptyValues: true
});


const {
  getProductByName,
  getSingleProduct,
  saveProducts,
  saveSingleProduct,
  getAllProducts,
  updateProduct
} = require('./controllers/products');

client.getAllProducts = getAllProducts.bind(client);
client.getProduct = getProductByName.bind(client);
client.getSingleProduct = getSingleProduct.bind(client);
client.saveSingleProduct = saveSingleProduct.bind(client);
client.saveProducts = saveProducts.bind(client);
client.updateProduct = updateProduct.bind(client);

const Product = require('./models/Product');

app.post('/products', function (req, res, next) {
  let submission = [];
  if (Array.isArray(req.body)) {
    // list of products
    submission = req.body.slice(0);
    submission = submission.map(item => Product(item.name, item.price));
  } else {
    // single product
    const name = req.body.name;
    const price = req.body.price;
    if (name && price) {
      submission.push(Product(name, price));
    } else {
      return res.status(400).end('/products POST endpoint requires a product name and price');
    }
  }
  client.saveProducts(submission, function (err, result) {
    if (err) {
      return res.status(400).json({ err });
    } else {
      return res.status(200).json(result);
    }
  });
});

app.get('/products', function (req, res) {
  if (req.query.name) {
    // query products
    const name = req.query.name;
    client.getProduct(name, function (error, result) {
      if (error) res.status(400).json(error);
      res.status(200).json(result);
    });
  } else {
    // send all products
    client.getAllProducts(function (error, result) {
      if (error) {
        res.status(400).json(error);
      }
      res.status(200).json(result);
    });
  }
});

app.get('/products/:productId', function (req, res) {
  const productId = req.params.productId;
  if (!productId) res.status(400).end('GET /products/:productId requires a productId be present in the URL.');
  client.getSingleProduct(productId, function (error, result) {
    if (error) res.status(400).json(error);
    res.status(200).json(result);
  });
});

app.post('/products/:productId', function (req, res) {
  // update route, get productId
  const productId = req.params.productId;
  // get new data from request
  const newData = {
    productId
  };
  if (req.body.name) newData.name = req.body.name;
  if (req.body.price) newData.price = req.body.price;
  // update product
  client.updateProduct(newData, function (error, result) {
    if (error) res.status(400).json(error);
    res.status(200).json(result);
  });
});

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});