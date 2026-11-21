const express = require('express');
const path = require('path');
const createProductRoutes = require('./api/productRoutes');
const { errorHandler, notFoundHandler } = require('./api/errorHandler');

function createApp({ productService }) {
    const app = express();

    app.use(express.json());

    // Віддаємо HTML-клієнт
    app.use(express.static(path.join(__dirname, '../frontend/public')));

    app.get('/health', (req, res) => {
        res.type('text/plain').send('ok');
    });

    // Контекст Catalog: сутність Product (маршрут /items — див. ADR 0003)
    app.use('/items', createProductRoutes(productService));

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
