const multer = require('multer');
const path = require('path');

// Memory storage for direct buffer upload to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/heic',
        'image/heif'
    ];

    const extname = allowedMimeTypes.includes(`image/${path.extname(file.originalname).toLowerCase().replace('.', '')}`);
    const mimetype = file.mimetype.startsWith('image/');

    if (mimetype && (extname || allowedMimeTypes.includes(file.mimetype))) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPG, PNG, GIF, WEBP, AVIF, HEIC, HEIF).'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

module.exports = upload;
