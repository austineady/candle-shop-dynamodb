const express = require('express');
const bodyParser = require('body-parser');
// local imports
const dynogels = require('./db/dynogels');

const PORT = 8080;
const app = express();
// setup body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const {
  createProduct,
  updateProduct,
  getAllProducts,
  getSingleProduct,
  queryProducts,
  deleteSingleProduct
} = require('./controllers/products');

app.post('/products', async function (req, res) {
  let payload = [];
  if (Array.isArray(req.body)) {
    payload = req.body.filter(function (item) {
      return (
        item.name !== undefined &&
        item.name.length > 0 &&
        item.price !== undefined &&
        item.price > 0
      );
    });

    if (payload.length === 0) {
      return res.status(400).send('POST requests to /products must include at least one product with a name and price.');
    }
  } else if (req.body.name && req.body.price) {
    payload.push({
      name: req.body.name,
      price: req.body.price
    });
  } else {
    return res.status(400).send('POST requests to /products must include a product name and price.');
  }

  try {
    const result = await createProduct(payload);
    res.status(200).json(result);
  } catch (error) {
    console.log(`Error creating product ${product.name}`);
    res.status(400).json(error);
  }
});

app.post('/products/:productId', async function (req, res) {
  if (!req.body.name && !req.body.price) {
    return res.status(400).send('POST requests to /products/:productId must include a product name or price.');
  } else {
    const productId = req.params.productId;
    // attach productId to new data
    const newProductData = { productId };
    // name check
    if (req.body.name) newProductData.name = req.body.name;
    // price check
    if (req.body.price) newProductData.price = req.body.price;
    // make request
    try {
      const newProduct = await updateProduct(newProductData);
      res.status(200).json(newProduct);
    } catch (error) {
      console.log(`Error updating product with productId: ${productId}`);
      res.status(400).json(error);
    }
  }
});

app.get('/products', async function (req, res) {
  try {
    if (Object.keys(req.query).length > 0) {
      const result = await queryProducts(req.query);
      res.status(200).json(result);
    } else {
      const allProducts = await getAllProducts();
      res.status(200).json(allProducts);
    }
  } catch (error) {
    console.error('Error retrieving all products');
    res.status(400).json(error);
  }
});

app.get('/products/:productId', async function (req, res) {
  try {
    const product = await getSingleProduct(req.params.productId);
    res.status(200).json(product);
  } catch (error) {
    console.log(`Error getting product with productId: ${req.params.productId}`);
    res.status(400).json(error);
  }
});

app.delete('/products/:productId', async function (req, res) {
  try {
    await deleteSingleProduct(req.params.productId);
    res.status(200).json({ status: 'Done' });
  } catch (error) {
    console.log(`Error deleting product with productId: ${req.params.productId}`);
    res.status(400).json(error);
  }
});

dynogels.createTables(function (err) {
  if (err) {
    console.log('Error creating tables: ', err);
  } else {
    console.log('Tables have been created');

    app.listen(PORT, function () {
      console.log(`Listening on PORT ${PORT}`);
    });
  }
});