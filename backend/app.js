
const express = require('express');
const path = require('path');

const createProductRoutes = require('./api/productRoutes');
const { errorHandler, notFoundHandler } = require('./api/errorHandler');

const requestId = require('./middleware/requestId');
const rateLimiter = require('./middleware/rateLimiter');

function createApp({ productService }) {
    const app = express();

    // Додаємо унікальний ID до кожного HTTP-запиту
    app.use(requestId);

    // Обмежуємо кількість запитів
    app.use(rateLimiter);

    // Дозволяємо серверу приймати JSON
    app.use(express.json());

    // Віддаємо HTML, CSS та JavaScript клієнту
    app.use(express.static(path.join(__dirname, '../frontend/public')));

    // Віддаємо фотографії товарів
    app.use(
        '/uploads',
        express.static(path.join(__dirname, 'uploads'))
    );

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
