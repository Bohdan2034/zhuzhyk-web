
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const uploadDirectory = path.join(
    __dirname,
    '../uploads/products'
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = allowedTypes[file.mimetype];

        const filename =
            `${crypto.randomUUID()}${extension}`;

        callback(null, filename);
    }
});

function fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (
        !allowedTypes[file.mimetype] ||
        !allowedExtensions.includes(extension)
    ) {
        return callback(
            new Error('Дозволені лише JPG, PNG та WEBP фотографії')
        );
    }

    callback(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

module.exports = upload;
