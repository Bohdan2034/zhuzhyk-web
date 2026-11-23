
require('dotenv').config();

const createApp = require('./app');
const { createPostgresPool } = require('./repository/postgresDatabase');
const PostgresProductRepository = require('./repository/PostgresProductRepository');
const ProductService = require('./service/ProductService');

const PORT = process.env.PORT || 3000;

async function startServer() {
    const pool = createPostgresPool();

    try {
        await pool.query('SELECT 1');

        const repository = new PostgresProductRepository(pool);
        const productService = new ProductService(repository);
        const app = createApp({ productService });

        app.listen(PORT, () => {
            console.log(`Сервер запущено: http://localhost:${PORT}`);
            console.log('База даних: PostgreSQL (Supabase)');
        });
    } catch (error) {
        console.error('Помилка запуску сервера:', error.message);
        await pool.end();
        process.exitCode = 1;
    }
}

startServer();
