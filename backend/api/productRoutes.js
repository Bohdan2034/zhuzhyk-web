const express = require('express');

// Тонкий шар: приймає запит, викликає service, повертає відповідь за контрактом.
// Жодної бізнес-логіки і жодного доступу до БД.
function createProductRoutes(productService) {
    const router = express.Router();

    router.get('/', (req, res) => {
        res.status(200).json(productService.list());
    });

    router.post('/', (req, res) => {
        const product = productService.create(req.body);
        res.status(201).location(`/items/${product.id}`).json(product);
    });

    router.get('/:id', (req, res) => {
        res.status(200).json(productService.get(req.params.id));
    });

    router.patch('/:id', (req, res) => {
        res.status(200).json(productService.update(req.params.id, req.body));
    });

    router.delete('/:id', (req, res) => {
        productService.remove(req.params.id);
        res.status(204).end();
    });

    return router;
}

module.exports = createProductRoutes;
