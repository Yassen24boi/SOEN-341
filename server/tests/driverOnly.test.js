const { MongoClient } = require('mongodb');

test('raw driver inside Jest', async () => {
  const client = new MongoClient(process.env.DATABASE_URL, {
    serverSelectionTimeoutMS: 5000,
  });
  try {
    await client.connect();
    await client.db().command({ ping: 1 });
  } finally {
    await client.close();
  }
});