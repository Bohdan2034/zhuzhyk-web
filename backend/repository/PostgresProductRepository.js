
class PostgresProductRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAll() {
        const result = await this.pool.query(`
            SELECT id, name, description, price, stock,
                   "imageUrl"
            FROM public.products
            ORDER BY id
        `);

        return result.rows.map(this.normalizeProduct);
    }

    async findById(id) {
        const result = await this.pool.query(`
            SELECT id, name, description, price, stock,
                   "imageUrl"
            FROM public.products
            WHERE id = $1
        `, [id]);

        return result.rows.length
            ? this.normalizeProduct(result.rows[0])
            : null;
    }

    async insert({ name, description, price, stock, imageUrl = null }) {
        const result = await this.pool.query(`
            INSERT INTO public.products
                (name, description, price, stock, "imageUrl")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, description, price, stock, "imageUrl"
        `, [name, description, price, stock, imageUrl]);

        return this.normalizeProduct(result.rows[0]);
    }

    async update(id, { name, description, price, stock, imageUrl }) {
        const result = await this.pool.query(`
            UPDATE public.products
            SET name = $1,
                description = $2,
                price = $3,
                stock = $4,
                "imageUrl" = COALESCE($5, "imageUrl")
            WHERE id = $6
            RETURNING id, name, description, price, stock, "imageUrl"
        `, [name, description, price, stock, imageUrl ?? null, id]);

        return result.rows.length
            ? this.normalizeProduct(result.rows[0])
            : null;
    }

    async delete(id) {
        const result = await this.pool.query(
            'DELETE FROM public.products WHERE id = $1',
            [id]
        );

        return result.rowCount > 0;
    }

    normalizeProduct(row) {
        return {
            ...row,
            id: Number(row.id),
            price: Number(row.price)
        };
    }
}

module.exports = PostgresProductRepository;
