const cloudinary = require('../config/cloudinary');

/**
 * Upload a file buffer to Cloudinary using upload_stream.
 * @param {Buffer} buffer - The file buffer from multer memory storage
 * @param {string} folder - The Cloudinary folder
 */
const uploadBuffer = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: `ecommerce/${folder}` },
            (error, result) => {
                if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(error);
                }
            }
        );
        stream.end(buffer);
    });
};

module.exports = {
    uploadBuffer
};
