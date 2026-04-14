const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// The Cloudinary SDK automatically detects and uses the CLOUDINARY_URL 
// environment variable if it is defined in the process environment.
// We just need to export the configured instance.

module.exports = cloudinary;
