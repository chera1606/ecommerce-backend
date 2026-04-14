const multer = require('multer');

// Store file temporarily in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Reject a file if it's not an image
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file format. Only JPG, JPEG, and PNG are allowed.'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB max size
    },
    fileFilter
});

module.exports = upload;
