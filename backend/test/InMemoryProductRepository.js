// Тестова реалізація репозиторію — без SQLite
class InMemoryProductRepository {
    constructor(rows = []) {
        this.rows = new Map(rows.map(row => [row.id, { ...row }]));
        this.nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    }

    findAll() {
        return [...this.rows.values()].map(row => ({ ...row }));
    }

    findById(id) {
        const row = this.rows.get(id);
        return row ? { ...row } : null;
    }

    insert(data) {
        const row = { id: this.nextId++, ...data };
        this.rows.set(row.id, row);
        return { ...row };
    }

    update(id, data) {
        if (!this.rows.has(id)) {
            return null;
        }

        const row = { id, ...data };
        this.rows.set(id, row);
        return { ...row };
    }

    delete(id) {
        return this.rows.delete(id);
    }
}

module.exports = InMemoryProductRepository;
