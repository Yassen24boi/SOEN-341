const safe = (fn) => { try { return fn(); } catch (e) { return 'ERR: ' + e.message; } };

console.log({
  window: typeof window,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  mongoose: safe(() => require('mongoose/package.json').version),
  mongodb: safe(() => require('mongodb/package.json').version),
  mongodbPath: safe(() => require.resolve('mongodb')),
  bsonPath: safe(() => require.resolve('bson')),
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
