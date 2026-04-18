const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const productCount = await Product.countDocuments();
        const categoryCount = await Category.countDocuments();

        console.log(`Products in DB: ${productCount}`);
        console.log(`Categories in DB: ${categoryCount}`);

        if (productCount > 0) {
            const sampleProduct = await Product.findOne();
            console.log('Sample Product ID:', sampleProduct._id);
            console.log('Sample Product Name:', sampleProduct.name);
        }

        process.exit(0);
    } catch (err) {
        console.error('DB Check Error:', err);
        process.exit(1);
    }
};

checkDB();
