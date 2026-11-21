const Database = require('better-sqlite3');

// Колонки, яких немає в таблиці з практичної 1 (id, name).
// SQLite дозволяє ADD COLUMN лише з константним DEFAULT.
const EXTRA_COLUMNS = [
    ['description', "TEXT NOT NULL DEFAULT ''"],
    ['price', 'REAL NOT NULL DEFAULT 0'],
    ['stock', 'INTEGER NOT NULL DEFAULT 0']
];

function openDatabase(filename) {
    const db = new Database(filename);

    db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    // Міграція: доповнюємо наявну БД новими полями Product
    const existing = new Set(
        db.prepare('PRAGMA table_info(items)').all().map(column => column.name)
    );

    for (const [name, definition] of EXTRA_COLUMNS) {
        if (!existing.has(name)) {
            db.exec(`ALTER TABLE items ADD COLUMN ${name} ${definition}`);
        }
    }

    seed(db);
    return db;
}

function seed(db) {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM items').get();

    if (total > 0) {
        return;
    }

    const insert = db.prepare(
        'INSERT INTO items (name, description, price, stock) VALUES (?, ?, ?, ?)'
    );

    insert.run('Перший елемент', 'Тестовий товар №1', 100, 10);
    insert.run('Другий елемент', 'Тестовий товар №2', 250.5, 5);
    insert.run('Третій елемент', 'Тестовий товар №3', 999, 0);
}

module.exports = { openDatabase };
