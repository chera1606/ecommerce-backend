const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('../src/models/Order');
const User = require('../src/models/User');

dotenv.config();

const checkDetails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find().select('status totalPrice createdAt');
        console.log('--- ORDERS ---');
        console.log(`Count: ${orders.length}`);
        orders.forEach(o => console.log(`ID: ${o._id}, Status: ${o.status}, Total: ${o.totalPrice}`));

        const users = await User.find().select('role firstName lastName');
        console.log('\n--- USERS ---');
        console.log(`Count: ${users.length}`);
        const roleCounts = {};
        users.forEach(u => {
            roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
        });
        console.log('Roles:', roleCounts);

        process.exit(0);
    } catch (err) {
        console.error('Check Error:', err);
        process.exit(1);
    }
};

checkDetails();
