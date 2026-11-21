const COLUMNS = 'id, name, description, price, stock';

// Єдине місце, де виконується SQL для товарів.
// Повертає прості об'єкти (рядки БД), не доменні сутності.
class SqliteProductRepository {
    constructor(db) {
        this.selectAll = db.prepare(`SELECT ${COLUMNS} FROM items ORDER BY id`);
        this.selectById = db.prepare(`SELECT ${COLUMNS} FROM items WHERE id = ?`);
        this.insertOne = db.prepare(
            'INSERT INTO items (name, description, price, stock) VALUES (?, ?, ?, ?)'
        );
        this.updateOne = db.prepare(
            'UPDATE items SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?'
        );
        this.deleteOne = db.prepare('DELETE FROM items WHERE id = ?');
    }

    findAll() {
        return this.selectAll.all();
    }

    findById(id) {
        return this.selectById.get(id) ?? null;
    }

    insert({ name, description, price, stock }) {
        const info = this.insertOne.run(name, description, price, stock);
        return this.findById(Number(info.lastInsertRowid));
    }

    update(id, { name, description, price, stock }) {
        const info = this.updateOne.run(name, description, price, stock, id);
        return info.changes > 0 ? this.findById(id) : null;
    }

    delete(id) {
        return this.deleteOne.run(id).changes > 0;
    }
}

module.exports = SqliteProductRepository;
