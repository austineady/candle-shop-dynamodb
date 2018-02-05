// Products Table
// -------------------------------
module.exports = {
  TableName: 'Products',
  KeySchema: [
    {
      AttributeName: 'productId',
      KeyType: 'HASH'
    }
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'productId',
      AttributeType: 'S'
    },
    {
      AttributeName: 'name',
      AttributeType: 'S'
    }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ProductName-index',
      KeySchema: [
        {
          AttributeName: 'name',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'productId',
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
};