
const express = require('express');
const path = require('path');

const createProductRoutes = require('./api/productRoutes');
const { errorHandler, notFoundHandler } = require('./api/errorHandler');

const requestId = require('./middleware/requestId');
const rateLimiter = require('./middleware/rateLimiter');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');

function createApp({ productService }) {
    const app = express();

    app.use(metricsMiddleware);
    app.get('/metrics', metricsHandler);

    // Додаємо унікальний ID до кожного HTTP-запиту
    app.use(requestId);

    // Обмежуємо кількість запитів
    app.use(rateLimiter);

    // Дозволяємо серверу приймати JSON
    app.use(express.json());

    // Віддаємо HTML, CSS та JavaScript клієнту
    app.use(express.static(path.join(__dirname, '../frontend/public')));

    // Перевірка працездатності сервера
   app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok'
    });
});

    // CRUD API для товарів
    app.use('/items', createProductRoutes(productService));

    // Обробка неіснуючих маршрутів
    app.use(notFoundHandler);

    // Централізована обробка помилок
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
