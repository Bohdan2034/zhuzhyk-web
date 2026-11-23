
const express = require('express');
const fs = require('fs');
const IdempotencyStore = require('../middleware/idempotencyStore');
const upload = require('../middleware/uploadMiddleware');

function createProductRoutes(productService) {
    const router = express.Router();
    const idempotencyStore = new IdempotencyStore();

    function prepareProductData(req) {
        const data = { ...req.body };

        // Multipart передає числові поля як рядки
        if (typeof data.price === 'string') {
            data.price = Number(data.price);
        }

        if (typeof data.stock === 'string') {
            data.stock = Number(data.stock);
        }

        if (req.file) {
            data.imageUrl = `/uploads/products/${req.file.filename}`;
        }

        return data;
    }

    function removeUploadedFile(req) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
    }

    // Отримання всіх товарів
    router.get('/', (req, res, next) => {
        try {
            res.status(200).json(productService.list());
        } catch (error) {
            next(error);
        }
    });

    // Створення товару з фотографією
    router.post('/', upload.single('image'), (req, res, next) => {
        try {
            const data = prepareProductData(req);
            const key = req.get('Idempotency-Key');

            if (!key) {
                const product = productService.create(data);

                return res.status(201)
                    .location(`/items/${product.id}`)
                    .json(product);
            }

            const idempotencyData = {
                ...data,
                uploadedFile: req.file
                    ? {
                        originalname: req.file.originalname,
                        mimetype: req.file.mimetype,
                        size: req.file.size
                    }
                    : null
            };

            const outcome = idempotencyStore.execute(
                key,
                idempotencyData,
                () => productService.create(data)
            );

            if (outcome.conflict) {
                removeUploadedFile(req);

                return res.status(409).json({
                    error: 'Conflict',
                    code: 'IDEMPOTENCY_KEY_CONFLICT',
                    requestId: req.requestId
                });
            }

            if (outcome.replayed) {
                removeUploadedFile(req);
            }

            res.setHeader(
                'Idempotency-Replayed',
                String(outcome.replayed)
            );

            return res.status(201)
                .location(`/items/${outcome.result.id}`)
                .json(outcome.result);

        } catch (error) {
            removeUploadedFile(req);
            next(error);
        }
    });

    // Отримання товару за ID
    router.get('/:id', (req, res, next) => {
        try {
            res.status(200).json(
                productService.get(req.params.id)
            );
        } catch (error) {
            next(error);
        }
    });

    // Редагування товару та заміна фотографії
    router.patch('/:id', upload.single('image'), (req, res, next) => {
        try {
            const data = prepareProductData(req);

            const product = productService.update(
                req.params.id,
                data
            );

            return res.status(200).json(product);

        } catch (error) {
            removeUploadedFile(req);
            next(error);
        }
    });

    // Видалення товару
    router.delete('/:id', (req, res, next) => {
        try {
            productService.remove(req.params.id);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    return router;
}

module.exports = createProductRoutes;
