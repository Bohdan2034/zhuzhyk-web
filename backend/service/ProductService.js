
const Product = require('../domain/Product');
const { ValidationError, NotFoundError } = require('./errors');
const { parseId, validateProductInput } = require('./productValidation');

function toDomain(row) {
    return new Product(
        row.id,
        row.name,
        row.description,
        row.price,
        row.stock,
        row.imageUrl ?? null
    );
}

function toDto(product) {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        ...(product.imageUrl ? { imageUrl: product.imageUrl } : {})
    };
}

function toRow(product) {
    return {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl
    };
}

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
        const { values, details } = validateProductInput(
            dto,
            { partial: false }
        );

        if (details.length > 0) {
            throw new ValidationError(details);
        }

        const product = new Product(
            null,
            values.name,
            values.description,
            values.price,
            values.stock,
            values.imageUrl ?? null
        );

        return toDto(
            toDomain(this.repository.insert(toRow(product)))
        );
    }

    update(rawId, dto) {
        const id = parseId(rawId);
        const existing = this.repository.findById(id);

        if (!existing) {
            throw new NotFoundError('Product', id);
        }

        const { values, details } = validateProductInput(
            dto,
            { partial: true }
        );

        if (details.length > 0) {
            throw new ValidationError(details);
        }

        const merged = new Product(
            id,
            values.name ?? existing.name,
            values.description ?? existing.description,
            values.price ?? existing.price,
            values.stock ?? existing.stock,
            values.imageUrl ?? existing.imageUrl ?? null
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
