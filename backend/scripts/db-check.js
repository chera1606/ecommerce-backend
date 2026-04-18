const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const User = require('../src/models/User');

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const productCount = await Product.countDocuments();
        const categoryCount = await Category.countDocuments();
        const orderCount = await Order.countDocuments();
        const userCount = await User.countDocuments();

        console.log(`Products: ${productCount}`);
        console.log(`Categories: ${categoryCount}`);
        console.log(`Orders: ${orderCount}`);
        console.log(`Users (Total): ${userCount}`);

        if (orderCount > 0) {
            const sampleOrder = await Order.findOne();
            console.log('Sample Order Status:', sampleOrder.status);
            console.log('Sample Order Total:', sampleOrder.totalPrice);
        }

        process.exit(0);
    } catch (err) {
        console.error('DB Check Error:', err);
        process.exit(1);
    }
};

checkDB();
