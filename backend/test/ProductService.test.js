const test = require('node:test');
const assert = require('node:assert/strict');

const ProductService = require('../service/ProductService');
const { ValidationError, NotFoundError } = require('../service/errors');
const InMemoryProductRepository = require('./InMemoryProductRepository');

function createService(rows = []) {
    return new ProductService(new InMemoryProductRepository(rows));
}

const milk = { id: 1, name: 'Молоко', description: '', price: 40, stock: 5 };

// ---- успішні випадки ----

test('create: коректні дані -> повертає створений товар з id', () => {
    const service = createService();

    const product = service.create({ name: '  Хліб  ', price: 25.5, stock: 3 });

    assert.deepEqual(product, {
        id: 1,
        name: 'Хліб',          // пробіли обрізано
        description: '',       // значення за замовчуванням
        price: 25.5,
        stock: 3
    });
    assert.deepEqual(service.get(1), product);
});

test('update: часткове оновлення змінює лише передані поля', () => {
    const service = createService([milk]);

    const updated = service.update('1', { price: 45 });

    assert.equal(updated.price, 45);
    assert.equal(updated.name, 'Молоко');
    assert.equal(updated.stock, 5);
});

test('remove: видаляє товар, після чого get кидає NotFoundError', () => {
    const service = createService([milk]);

    service.remove('1');

    assert.throws(() => service.get('1'), NotFoundError);
});

// ---- помилкові випадки ----

test('create: відсутнє обов’язкове поле name -> ValidationError', () => {
    const service = createService();

    assert.throws(
        () => service.create({ price: 10 }),
        err => {
            assert.ok(err instanceof ValidationError);
            assert.ok(err.details.some(d => d.field === 'name'));
            return true;
        }
    );
    assert.equal(service.list().length, 0); // нічого не збережено
});

test('create: від’ємна ціна та нецілий залишок -> помилки по обох полях', () => {
    const service = createService();

    assert.throws(
        () => service.create({ name: 'Тест', price: -1, stock: 1.5 }),
        err => {
            const fields = err.details.map(d => d.field).sort();
            assert.deepEqual(fields, ['price', 'stock']);
            return true;
        }
    );
});

test('create: тіло не є об’єктом -> ValidationError (field = body)', () => {
    const service = createService();

    for (const body of [undefined, null, 'text', []]) {
        assert.throws(
            () => service.create(body),
            err => err instanceof ValidationError && err.details[0].field === 'body'
        );
    }
});

test('update: порожній PATCH -> ValidationError', () => {
    const service = createService([milk]);

    assert.throws(() => service.update('1', {}), ValidationError);
});

test('get/update/remove: неіснуючий id -> NotFoundError', () => {
    const service = createService();

    assert.throws(() => service.get('99'), NotFoundError);
    assert.throws(() => service.update('99', { name: 'X' }), NotFoundError);
    assert.throws(() => service.remove('99'), NotFoundError);
});

test('get: некоректний id -> ValidationError (field = id)', () => {
    const service = createService([milk]);

    for (const id of ['abc', '0', '-5', '1.5', '']) {
        assert.throws(
            () => service.get(id),
            err => err instanceof ValidationError && err.details[0].field === 'id'
        );
    }
});
