const Product = require('../domain/Product');
const { ValidationError, NotFoundError } = require('./errors');
const { parseId, validateProductInput } = require('./productValidation');

// Рядок з репозиторію -> доменна сутність
function toDomain(row) {
    return new Product(row.id, row.name, row.description, row.price, row.stock);
}

// Доменна сутність -> DTO відповіді (контракт openapi.yaml: схема Product)
function toDto(product) {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock
    };
}

function toRow(product) {
    return {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock
    };
}

// Use-cases каталогу. Репозиторій передається ззовні (DI), тому сервіс
// не залежить від SQLite і легко тестується з in-memory реалізацією.
class ProductService {
    constructor(repository) {
        this.repository = repository;
    }

    list() {
        return this.repository.findAll().map(row => toDto(toDomain(row)));
    }

    get(rawId) {
        const id = parseId(rawId);
        const row = this.repository.findById(id);

        if (!row) {
            throw new NotFoundError('Product', id);
        }

        return toDto(toDomain(row));
    }

    create(dto) {
        const { values, details } = validateProductInput(dto, { partial: false });

        if (details.length > 0) {
            throw new ValidationError(details);
        }

        const product = new Product(
            null, values.name, values.description, values.price, values.stock
        );

        return toDto(toDomain(this.repository.insert(toRow(product))));
    }

    update(rawId, dto) {
        const id = parseId(rawId);
        const existing = this.repository.findById(id);

        if (!existing) {
            throw new NotFoundError('Product', id);
        }

        const { values, details } = validateProductInput(dto, { partial: true });

        if (details.length > 0) {
            throw new ValidationError(details);
        }

        // Зливаємо зміни з поточним станом і перевіряємо інваріанти домену
        const merged = new Product(
            id,
            values.name ?? existing.name,
            values.description ?? existing.description,
            values.price ?? existing.price,
            values.stock ?? existing.stock
        );

        const saved = this.repository.update(id, toRow(merged));

        if (!saved) {
            throw new NotFoundError('Product', id);
        }

        return toDto(toDomain(saved));
    }

    remove(rawId) {
        const id = parseId(rawId);

        if (!this.repository.delete(id)) {
            throw new NotFoundError('Product', id);
        }
    }
}

module.exports = ProductService;
