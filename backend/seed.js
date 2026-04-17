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

const categoriesData = [
    { name: 'CLOTHING', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b', subcategories: ['Men', 'Women', 'Children'] },
    { name: 'SHOES', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' },
    { name: 'ELECTRONICS', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661' },
    { name: 'HOME MATERIALS', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38' },
    { name: 'BEAUTY', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796' },
    { name: 'ACCESSORIES', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' }
];

const productsTemplate = [
    // SHOES
    {
        name: 'Nike Air Max 270',
        price: 150, unitPrice: 150, inventoryLevel: 50,
        description: 'Stylish and comfortable shoe for everyday wear.',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
        featured: true, rating: 4.8, classification: 'SHOES'
    },
    {
        name: 'Adidas Ultraboost',
        price: 180, unitPrice: 180, inventoryLevel: 40,
        description: 'Incredible energy return and comfort for running.',
        images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a'],
        featured: false, rating: 4.7, classification: 'SHOES'
    },
    {
        name: 'Puma RS-X Bold',
        price: 110, unitPrice: 110, inventoryLevel: 60,
        description: 'Retro-inspired design with modern comfort.',
        images: ['https://images.unsplash.com/photo-1588099768531-a72d4a198538'],
        featured: true, rating: 4.5, classification: 'SHOES'
    },
    {
        name: 'Reebok Classic Leather',
        price: 85, unitPrice: 85, inventoryLevel: 100,
        description: 'Timeless design that never goes out of style.',
        images: ['https://images.unsplash.com/photo-1539185441755-769473a23957'],
        featured: false, rating: 4.4, classification: 'SHOES'
    },
    {
        name: 'Vans Old Skool',
        price: 65, unitPrice: 65, inventoryLevel: 120,
        description: 'The classic skate shoe that started it all.',
        images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77'],
        featured: false, rating: 4.3, classification: 'SHOES'
    },

    // ELECTRONICS
    {
        name: 'Sony WH-1000XM4',
        price: 349, unitPrice: 349, inventoryLevel: 25,
        description: 'Industry-leading noise canceling wireless headphones.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
        featured: true, rating: 4.9, classification: 'ELECTRONICS'
    },
    {
        name: 'Apple MacBook Air M2',
        price: 1199, unitPrice: 1199, inventoryLevel: 15,
        description: 'Strikingly thin and fast laptop with M2 chip.',
        images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853'],
        featured: true, rating: 4.8, classification: 'ELECTRONICS'
    },
    {
        name: 'Bose QuietComfort 45',
        price: 329, unitPrice: 329, inventoryLevel: 30,
        description: 'Legendary noise canceling headphones with a world-class quiet.',
        images: ['https://images.unsplash.com/photo-1546435770-a3e426ff472b'],
        featured: false, rating: 4.7, classification: 'ELECTRONICS'
    },
    {
        name: 'Samsung Galaxy Watch 5',
        price: 279, unitPrice: 279, inventoryLevel: 45,
        description: 'Advanced health tracking and long-lasting battery.',
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12'],
        featured: true, rating: 4.6, classification: 'ELECTRONICS'
    },
    {
        name: 'Logitech MX Master 3S',
        price: 99, unitPrice: 99, inventoryLevel: 75,
        description: 'The ultimate productivity mouse for creators.',
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'],
        featured: false, rating: 4.5, classification: 'ELECTRONICS'
    },

    // CLOTHING - Men
    {
        name: 'Classic Casual Shirt',
        price: 45, unitPrice: 45, inventoryLevel: 80,
        description: 'Button-down shirt for casual and semi-formal wear.',
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c'],
        featured: true, rating: 4.6, classification: 'CLOTHING', subCategory: 'Men'
    },
    {
        name: 'Slim Fit Chinos',
        price: 55, unitPrice: 55, inventoryLevel: 60,
        description: 'Comfortable and stylish chinos for daily use.',
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246'],
        featured: false, rating: 4.4, classification: 'CLOTHING', subCategory: 'Men'
    },

    // CLOTHING - Women
    {
        name: 'Summer Floral Dress',
        price: 75, unitPrice: 75, inventoryLevel: 35,
        description: 'Lightweight and breezy floral dress.',
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1'],
        featured: false, rating: 4.5, classification: 'CLOTHING', subCategory: 'Women'
    },
    {
        name: 'Denim Trucker Jacket',
        price: 85, unitPrice: 85, inventoryLevel: 40,
        description: 'A timeless denim jacket for any season.',
        images: ['https://images.unsplash.com/photo-1523205771623-e0faa4d2813d'],
        featured: true, rating: 4.6, classification: 'CLOTHING', subCategory: 'Women'
    },

    // CLOTHING - Children
    {
        name: 'Kids Cotton Hoodie',
        price: 35, unitPrice: 35, inventoryLevel: 100,
        description: 'Warm and cozy cotton hoodie for kids.',
        images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba'],
        featured: true, rating: 4.7, classification: 'CLOTHING', subCategory: 'Children'
    },

    // HOME MATERIALS
    {
        name: 'Luxury Scented Candle',
        price: 30, unitPrice: 30, inventoryLevel: 150,
        description: 'Relaxing atmosphere with natural wax.',
        images: ['https://images.unsplash.com/photo-1603006d64111-9a74427514f0'],
        featured: true, rating: 4.5, classification: 'HOME MATERIALS'
    },
    {
        name: 'Ceramic Flower Vase',
        price: 55, unitPrice: 55, inventoryLevel: 45,
        description: 'Elegant ceramic vase for home decoration.',
        images: ['https://images.unsplash.com/photo-1581783898377-1c85bf937427'],
        featured: false, rating: 4.4, classification: 'HOME MATERIALS'
    },
    {
        name: 'Wool Throw Blanket',
        price: 45, unitPrice: 45, inventoryLevel: 90,
        description: 'Soft wool blanket to keep you warm.',
        images: ['https://images.unsplash.com/photo-1520111166314-8789887700df'],
        featured: true, rating: 4.6, classification: 'HOME MATERIALS'
    },
    {
        name: 'Decorative Wall Mirror',
        price: 125, unitPrice: 125, inventoryLevel: 20,
        description: 'Modern wall mirror to brighten your space.',
        images: ['https://images.unsplash.com/photo-1618220179428-22790b461013'],
        featured: false, rating: 4.3, classification: 'HOME MATERIALS'
    },
    {
        name: 'Coffee Table Book',
        price: 35, unitPrice: 35, inventoryLevel: 150,
        description: 'A beautiful collection of art and photography.',
        images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f'],
        featured: false, rating: 4.5, classification: 'HOME MATERIALS'
    },

    // BEAUTY
    {
        name: 'Glow Face Serum',
        price: 55, unitPrice: 55, inventoryLevel: 45,
        description: 'Rejuvenating face serum for glowing skin.',
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be'],
        featured: true, rating: 4.8, classification: 'BEAUTY'
    },
    {
        name: 'Hydrating Matte Lipstick',
        price: 25, unitPrice: 25, inventoryLevel: 150,
        description: 'Long-lasting and vibrant lipstick.',
        images: ['https://images.unsplash.com/photo-1586776174824-00e964b0a84e'],
        featured: false, rating: 4.4, classification: 'BEAUTY'
    },
    {
        name: 'Natural Sunscreen SPF 50',
        price: 35, unitPrice: 35, inventoryLevel: 80,
        description: 'Broad-spectrum protection for your skin.',
        images: ['https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8'],
        featured: true, rating: 4.7, classification: 'BEAUTY'
    },
    {
        name: 'Smoothing Night Cream',
        price: 65, unitPrice: 65, inventoryLevel: 55,
        description: 'Wake up with soft and refreshed skin.',
        images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571'],
        featured: false, rating: 4.6, classification: 'BEAUTY'
    },
    {
        name: 'Rosewater Face Mist',
        price: 20, unitPrice: 20, inventoryLevel: 200,
        description: 'Cooling mist to refresh your face anytime.',
        images: ['https://images.unsplash.com/photo-1590651336093-41551ee6e17a'],
        featured: false, rating: 4.5, classification: 'BEAUTY'
    },

    // ACCESSORIES
    {
        name: 'Leather Minimalist Wallet',
        price: 45, unitPrice: 45, inventoryLevel: 20,
        description: 'Genuine leather wallet for the modern professional.',
        images: ['https://images.unsplash.com/photo-1627123424574-724758594e93'],
        featured: true, rating: 4.7, classification: 'ACCESSORIES'
    },
    {
        name: 'Aviator Sunglasses',
        price: 125, unitPrice: 125, inventoryLevel: 50,
        description: 'Classic aviator sunglasses with polarized lenses.',
        images: ['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a'],
        featured: true, rating: 4.8, classification: 'ACCESSORIES'
    },
    {
        name: 'Canvas Rolltop Backpack',
        price: 65, unitPrice: 65, inventoryLevel: 45,
        description: 'Durable and stylish backpack for daily trips.',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62'],
        featured: true, rating: 4.6, classification: 'ACCESSORIES'
    },
    {
        name: 'Soft Wool Scarf',
        price: 35, unitPrice: 35, inventoryLevel: 90,
        description: 'Keep warm with this high-quality wool scarf.',
        images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9'],
        featured: false, rating: 4.4, classification: 'ACCESSORIES'
    },
    {
        name: 'Modern Smart Band',
        price: 49, unitPrice: 49, inventoryLevel: 100,
        description: 'Simplified fitness tracker for a minimalist lifestyle.',
        images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6'],
        featured: false, rating: 4.3, classification: 'ACCESSORIES'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Cloud MongoDB');

        await Category.deleteMany({});
        await Product.deleteMany({});

        console.log('Seeding Hierarchical Categories...');
        const createdCategories = [];

        for (const catData of categoriesData) {
            const clURL = await uploadImage(catData.image, 'categories');
            const parent = await Category.create({ name: catData.name, image: clURL });
            createdCategories.push(parent);

            if (catData.subcategories) {
                for (const subName of catData.subcategories) {
                    const sub = await Category.create({ 
                        name: subName, 
                        parent: parent._id,
                        image: 'https://via.placeholder.com/150'
                    });
                    createdCategories.push(sub);
                }
            }
        }
        console.log('Categories seeded (including subcategories)');

        console.log('Uploading product images and linking categories...');
        const productsWithImages = await Promise.all(productsTemplate.map(async (p, index) => {
            const clImages = await Promise.all(p.images.map(img => uploadImage(img, 'products')));
            
            // Link to subcategory if specified, otherwise parent classification
            let targetCategory;
            if (p.subCategory) {
                targetCategory = createdCategories.find(c => c.name === p.subCategory);
            } else {
                targetCategory = createdCategories.find(c => c.name === p.classification);
            }

            return {
                ...p,
                images: clImages,
                imageUrl: clImages[0],
                category: targetCategory ? targetCategory._id : null,
                sku: `SKU-${Date.now()}-${index}`,
                stock: p.inventoryLevel
            };
        }));

        await Product.insertMany(productsWithImages);
        console.log('Products seeded with correct classification and hierarchy');

        console.log('Data Seeding Completed Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedDB();
