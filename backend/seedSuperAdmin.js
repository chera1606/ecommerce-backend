const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');

dotenv.config();

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@eshop.com').toLowerCase();
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
const SUPER_ADMIN_FIRST_NAME = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
const SUPER_ADMIN_LAST_NAME = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

const seedSuperAdmin = async () => {
  try {
    if (SUPER_ADMIN_PASSWORD.length < 8) {
      throw new Error('SUPER_ADMIN_PASSWORD must be at least 8 characters long.');
    }

    await connectDB();

    const existingUser = await User.findOne({ email: SUPER_ADMIN_EMAIL });

    if (existingUser) {
      existingUser.firstName = SUPER_ADMIN_FIRST_NAME;
      existingUser.lastName = SUPER_ADMIN_LAST_NAME;
      existingUser.role = 'SUPER_ADMIN';
      existingUser.status = 'ACTIVE';
      existingUser.password = SUPER_ADMIN_PASSWORD;
      await existingUser.save();
      console.log(`Super admin account updated: ${SUPER_ADMIN_EMAIL}`);
    } else {
      await User.create({
        firstName: SUPER_ADMIN_FIRST_NAME,
        lastName: SUPER_ADMIN_LAST_NAME,
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });
      console.log(`Super admin account created: ${SUPER_ADMIN_EMAIL}`);
    }

    console.log('Default super admin credentials:');
    console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin account:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
