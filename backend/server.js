const path = require('path');
const createApp = require('./app');
const { openDatabase } = require('./repository/database');
const SqliteProductRepository = require('./repository/SqliteProductRepository');
const ProductService = require('./service/ProductService');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'items.db');

// Composition root: тут збираються всі шари разом
const db = openDatabase(DB_PATH);
const productService = new ProductService(new SqliteProductRepository(db));
const app = createApp({ productService });

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});
