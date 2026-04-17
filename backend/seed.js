const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const User = require('./src/models/User');

dotenv.config();

const cloudinary = require('./src/config/cloudinary');

/**
 * Upload an image URL to Cloudinary and return the secure URL.
 * @param {string} url - The external image URL
 * @param {string} folder - The Cloudinary folder
 */
const uploadImage = async (url, folder) => {
    try {
        const result = await cloudinary.uploader.upload(url, {
            folder: `ecommerce/${folder}`,
            use_filename: true,
            unique_filename: true
        });
        return result.secure_url;
    } catch (error) {
        console.error(`Failed to upload ${url} to Cloudinary:`, error.message);
        return url; // Fallback to original URL on failure
    }
};

const categories = [
    { name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' },
    { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661' },
    { name: 'Apparel', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' }
];

const productsTemplate = [
    // FOOTWEAR
    {
        name: 'Nike Air Max 270',
        price: 150,
        unitPrice: 150,
        inventoryLevel: 50,
        description: 'The Nike Air Max 270 is a stylish and comfortable shoe for everyday wear.',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
        featured: true,
        rating: 4.8,
        stock: 50,
        sizes: ['8', '9', '10', '11'],
        colors: ['Red', 'Black'],
        classification: 'FOOTWEAR'
    },
    {
        name: 'Adidas Ultraboost',
        price: 180,
        unitPrice: 180,
        inventoryLevel: 40,
        description: 'The Adidas Ultraboost provides incredible energy return and comfort.',
        images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a'],
        featured: false,
        rating: 4.7,
        stock: 40,
        sizes: ['7', '8', '9', '10'],
        colors: ['White', 'Grey'],
        classification: 'FOOTWEAR'
    },
    {
        name: 'Puma RS-X',
        price: 110,
        unitPrice: 110,
        inventoryLevel: 60,
        description: 'Retro-inspired design with modern comfort and style.',
        images: ['https://images.unsplash.com/photo-1588099768531-a72d4a198538'],
        featured: true,
        rating: 4.5,
        stock: 60,
        sizes: ['8', '9', '10'],
        colors: ['Blue', 'White', 'Yellow'],
        classification: 'FOOTWEAR'
    },
    {
        name: 'Converse Chuck Taylor',
        price: 65,
        unitPrice: 65,
        inventoryLevel: 100,
        description: 'The classic high-top sneaker that never goes out of style.',
        images: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d'],
        featured: false,
        rating: 4.3,
        stock: 100,
        sizes: ['6', '7', '8', '9', '10', '11'],
        colors: ['Black', 'White'],
        classification: 'FOOTWEAR'
    },
    {
        name: 'Jordan 1 Retro High',
        price: 170,
        unitPrice: 170,
        inventoryLevel: 25,
        description: 'Iconic basketball sneakers with premium leather and heritage style.',
        images: ['https://images.unsplash.com/photo-1552346154-21d32810aba3'],
        featured: true,
        rating: 4.9,
        stock: 25,
        sizes: ['9', '10', '11', '12'],
        colors: ['Red', 'Black', 'White'],
        classification: 'FOOTWEAR'
    },

    // ELECTRONICS
    {
        name: 'Wireless Headphones',
        price: 299,
        unitPrice: 299,
        inventoryLevel: 30,
        description: 'Experience premium sound with our noise-canceling wireless headphones.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
        featured: true,
        rating: 4.5,
        stock: 30,
        colors: ['Silver', 'Black'],
        classification: 'ELECTRONICS'
    },
    {
        name: 'Smart Watch Series 7',
        price: 399,
        unitPrice: 399,
        inventoryLevel: 45,
        description: 'Track your fitness and stay connected with the latest smart watch.',
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12'],
        featured: true,
        rating: 4.6,
        stock: 45,
        colors: ['Space Grey', 'Starlight'],
        classification: 'ELECTRONICS'
    },
    {
        name: 'Bluetooth Speaker',
        price: 89,
        unitPrice: 89,
        inventoryLevel: 75,
        description: 'Portable bluetooth speaker with deep bass and waterproof design.',
        images: ['https://images.unsplash.com/photo-1512446813986-43a288b0c957'],
        featured: false,
        rating: 4.4,
        stock: 75,
        colors: ['Black', 'Blue'],
        classification: 'ELECTRONICS'
    },
    {
        name: 'Laptop Pro 14',
        price: 1999,
        unitPrice: 1999,
        inventoryLevel: 15,
        description: 'High-performance laptop for professionals and creators.',
        images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853'],
        featured: true,
        rating: 4.9,
        stock: 15,
        colors: ['Grey', 'Silver'],
        classification: 'ELECTRONICS'
    },
    {
        name: 'Wireless Mouse',
        price: 49,
        unitPrice: 49,
        inventoryLevel: 120,
        description: 'Ergonomic wireless mouse for smooth and precise control.',
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'],
        featured: false,
        rating: 4.2,
        stock: 120,
        colors: ['Black'],
        classification: 'ELECTRONICS'
    },

    // APPAREL
    {
        name: 'Classic Cotton T-Shirt',
        price: 25,
        unitPrice: 25,
        inventoryLevel: 100,
        description: 'A soft and breathable cotton t-shirt for daily comfort.',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
        featured: false,
        rating: 4.2,
        stock: 100,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Navy'],
        classification: 'APPAREL'
    },
    {
        name: 'Denim Jacket',
        price: 85,
        unitPrice: 85,
        inventoryLevel: 40,
        description: 'A timeless denim jacket that goes with any outfit.',
        images: ['https://images.unsplash.com/photo-1523205771623-e0faa4d2813d'],
        featured: true,
        rating: 4.6,
        stock: 40,
        sizes: ['M', 'L', 'XL'],
        colors: ['Blue'],
        classification: 'APPAREL'
    },
    {
        name: 'Slim Fit Chinos',
        price: 55,
        unitPrice: 55,
        inventoryLevel: 60,
        description: 'Comfortable and stylish slim fit chinos for any occasion.',
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246'],
        featured: false,
        rating: 4.4,
        stock: 60,
        sizes: ['30', '32', '34', '36'],
        colors: ['Khaki', 'Navy', 'Olive'],
        classification: 'APPAREL'
    },
    {
        name: 'Hoodie Sweatshirt',
        price: 45,
        unitPrice: 45,
        inventoryLevel: 80,
        description: 'Cozy hoodie sweatshirt perfect for cooler days.',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7'],
        featured: true,
        rating: 4.7,
        stock: 80,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Grey', 'Black'],
        classification: 'APPAREL'
    },
    {
        name: 'Summer Floral Dress',
        price: 75,
        unitPrice: 75,
        inventoryLevel: 35,
        description: 'Lightweight and breezy floral dress for summer days.',
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1'],
        featured: false,
        rating: 4.5,
        stock: 35,
        sizes: ['S', 'M', 'L'],
        colors: ['Floral'],
        classification: 'APPAREL'
    },

    // ACCESSORIES
    {
        name: 'Leather Minimalist Wallet',
        price: 45,
        unitPrice: 45,
        inventoryLevel: 20,
        description: 'A slim, genuine leather wallet for the modern professional.',
        images: ['https://images.unsplash.com/photo-1627123424574-724758594e93'],
        featured: true,
        rating: 4.7,
        stock: 20,
        colors: ['Brown', 'Black'],
        classification: 'ACCESSORIES'
    },
    {
        name: 'Aviator Sunglasses',
        price: 125,
        unitPrice: 125,
        inventoryLevel: 50,
        description: 'Classic aviator sunglasses with polarized lenses.',
        images: ['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a'],
        featured: true,
        rating: 4.8,
        stock: 50,
        colors: ['Gold', 'Silver'],
        classification: 'ACCESSORIES'
    },
    {
        name: 'Wool Scarf',
        price: 35,
        unitPrice: 35,
        inventoryLevel: 90,
        description: 'Soft wool scarf to keep you warm and stylish in winter.',
        images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9'],
        featured: false,
        rating: 4.4,
        stock: 90,
        colors: ['Grey', 'Burgundy'],
        classification: 'ACCESSORIES'
    },
    {
        name: 'Canvas Backpack',
        price: 65,
        unitPrice: 65,
        inventoryLevel: 45,
        description: 'Durable canvas backpack for school or day trips.',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62'],
        featured: true,
        rating: 4.6,
        stock: 45,
        colors: ['Green', 'Black'],
        classification: 'ACCESSORIES'
    },
    {
        name: 'Beanie Hat',
        price: 20,
        unitPrice: 20,
        inventoryLevel: 150,
        description: 'Simple and warm beanie hat for everyday wear.',
        images: ['https://images.unsplash.com/photo-1534215754734-18e55d13e346'],
        featured: false,
        rating: 4.2,
        stock: 150,
        colors: ['Grey', 'Navy', 'Orange'],
        classification: 'ACCESSORIES'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data (optional, but good for clean seed)
        await Category.deleteMany({});
        await Product.deleteMany({});
        // await Order.deleteMany({}); // Uncomment if you want to clear orders too

        // Seed Categories with Cloudinary Uploads
        console.log('Uploading category images to Cloudinary...');
        const categoriesWithImages = await Promise.all(categories.map(async (cat) => {
            const clURL = await uploadImage(cat.image, 'categories');
            return { ...cat, image: clURL };
        }));
        const createdCategories = await Category.insertMany(categoriesWithImages);
        console.log('Categories seeded with Cloudinary images');

        // Seed Products with Cloudinary Uploads
        console.log('Uploading product images to Cloudinary (this may take a minute)...');
        const productsWithImages = await Promise.all(productsTemplate.map(async (p, index) => {
            // Upload main images
            const clImages = await Promise.all(p.images.map(img => uploadImage(img, 'products')));
            
            const category = createdCategories.find(c => c.name === p.classification.charAt(0) + p.classification.slice(1).toLowerCase());
            return {
                ...p,
                images: clImages,
                category: category ? category._id : createdCategories[0]._id,
                sku: `SKU-${Date.now()}-${index}`
            };
        }));

        const createdProducts = await Product.insertMany(productsWithImages);
        console.log('Products seeded with Cloudinary images');

        // Seed some mock orders to test Top Sellers
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            const mockOrders = [
                {
                    userId: adminUser._id,
                    items: [
                        { productId: createdProducts[0]._id, quantity: 5, price: createdProducts[0].price },
                        { productId: createdProducts[1]._id, quantity: 2, price: createdProducts[1].price }
                    ],
                    totalPrice: createdProducts[0].price * 5 + createdProducts[1].price * 2,
                    status: 'DELIVERED'
                },
                {
                    userId: adminUser._id,
                    items: [
                        { productId: createdProducts[0]._id, quantity: 10, price: createdProducts[0].price }
                    ],
                    totalPrice: createdProducts[0].price * 10,
                    status: 'DELIVERED'
                }
            ];
            await Order.insertMany(mockOrders);
            console.log('Mock orders seeded for top sellers');
        }

        console.log('Data Seeding Completed Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedDB();
