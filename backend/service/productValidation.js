const { ValidationError } = require('./errors');

const NAME_MAX = 200;
const DESCRIPTION_MAX = 2000;
const FIELDS = ['name', 'description', 'price', 'stock'];

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Додатне ціле число з path-параметра. Інакше — ValidationError.
function parseId(raw) {
    const text = String(raw);
    const id = Number(text);

    if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(id)) {
        throw new ValidationError([
            { field: 'id', message: 'ID повинен бути додатним цілим числом' }
        ]);
    }

    return id;
}

// Перевіряє тіло запиту (CreateProductRequest / UpdateProductRequest).
// partial = true — для PATCH: кожне поле необов'язкове, але потрібне хоча б одне.
// Повертає { values, details }: values — очищені значення, details — помилки.
function validateProductInput(dto, { partial }) {
    if (!isPlainObject(dto)) {
        return {
            values: {},
            details: [{ field: 'body', message: 'Тіло запиту має бути JSON-об’єктом' }]
        };
    }

    const has = key => Object.prototype.hasOwnProperty.call(dto, key);
    const values = {};
    const details = [];

    // name
    if (has('name')) {
        if (typeof dto.name !== 'string' || !dto.name.trim()) {
            details.push({ field: 'name', message: 'Назва обов’язкова і не може бути порожньою' });
        } else if (dto.name.trim().length > NAME_MAX) {
            details.push({ field: 'name', message: `Назва не може бути довшою за ${NAME_MAX} символів` });
        } else {
            values.name = dto.name.trim();
        }
    } else if (!partial) {
        details.push({ field: 'name', message: 'Назва обов’язкова' });
    }

    // description
    if (has('description')) {
        if (typeof dto.description !== 'string') {
            details.push({ field: 'description', message: 'Опис повинен бути рядком' });
        } else if (dto.description.length > DESCRIPTION_MAX) {
            details.push({ field: 'description', message: `Опис не може бути довшим за ${DESCRIPTION_MAX} символів` });
        } else {
            values.description = dto.description;
        }
    } else if (!partial) {
        values.description = '';
    }

    // price
    if (has('price')) {
        if (typeof dto.price !== 'number' || !Number.isFinite(dto.price) || dto.price < 0) {
            details.push({ field: 'price', message: 'Ціна повинна бути невід’ємним числом' });
        } else {
            values.price = dto.price;
        }
    } else if (!partial) {
        details.push({ field: 'price', message: 'Ціна обов’язкова' });
    }

    // stock
    if (has('stock')) {
        if (!Number.isInteger(dto.stock) || dto.stock < 0) {
            details.push({ field: 'stock', message: 'Залишок повинен бути невід’ємним цілим числом' });
        } else {
            values.stock = dto.stock;
        }
    } else if (!partial) {
        values.stock = 0;
    }

    if (partial && !FIELDS.some(has)) {
        details.push({
            field: 'body',
            message: `Потрібно вказати хоча б одне поле: ${FIELDS.join(', ')}`
        });
    }

    return { values, details };
}

module.exports = { parseId, validateProductInput, NAME_MAX, DESCRIPTION_MAX };
