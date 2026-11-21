
const express = require('express');
const IdempotencyStore = require('../middleware/idempotencyStore');

function createProductRoutes(productService) {
    const router = express.Router();
    const idempotencyStore = new IdempotencyStore();

    // Отримання всіх товарів
    router.get('/', (req, res) => {
        res.status(200).json(productService.list());
    });

    // Створення товару із захистом від дублювання
    router.post('/', (req, res) => {
        const key = req.get('Idempotency-Key');

        // Якщо ключ не передано, звичайне створення
        if (!key) {
            const product = productService.create(req.body);
            return res.status(201)
                .location(`/items/${product.id}`)
                .json(product);
        }

        // Перевірка повторного запиту
        const outcome = idempotencyStore.execute(
            key,
            req.body,
            () => productService.create(req.body)
        );

        // Той самий ключ використано з іншими даними
        if (outcome.conflict) {
            return res.status(409).json({
                error: 'Conflict',
                code: 'IDEMPOTENCY_KEY_CONFLICT',
                requestId: req.requestId
            });
        }

        // Повідомляємо, чи результат узято з кешу
        res.setHeader(
            'Idempotency-Replayed',
            String(outcome.replayed)
        );

        return res.status(201)
            .location(`/items/${outcome.result.id}`)
            .json(outcome.result);
    });

    // Отримання товару за ID
    router.get('/:id', (req, res) => {
        res.status(200).json(productService.get(req.params.id));
    });

    // Часткове оновлення товару
    router.patch('/:id', (req, res) => {
        res.status(200).json(
            productService.update(req.params.id, req.body)
        );
    });

    // Видалення товару
    router.delete('/:id', (req, res) => {
        productService.remove(req.params.id);
        res.status(204).end();
    });

    return router;
}

module.exports = createProductRoutes;
