console.log({
  window: typeof window,
  mongoose: require('mongoose/package.json').version,
  mongodb: require('mongodb/package.json').version,
  bson: require('bson/package.json').version,
  mongodbPath: require.resolve('mongodb'),
  bsonPath: require.resolve('bson'),
  nodeVersion: process.version,
  versions: typeof process.versions,
  platform: process.platform,
  arch: process.arch,
});
const mongoose = require('mongoose');

jest.setTimeout(15000);

test('MongoDB connects inside Jest', async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            serverSelectionTimeoutMS: 5000
        });

        expect(mongoose.connection.readyState).toBe(1);
        console.log('JEST MONGODB CONNECTION SUCCESS');
    } finally {
        await mongoose.disconnect();
    }
});
