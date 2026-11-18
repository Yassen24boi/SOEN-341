
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
