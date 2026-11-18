const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

test('MongoDB connects using Node.js', async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 10000
    });

    assert.equal(mongoose.connection.readyState, 1);

    console.log('SUCCESS: MongoDB connected using Node test runner!');
  } finally {
    await mongoose.disconnect();
  }
});