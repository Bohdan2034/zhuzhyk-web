
const test = require('node:test');
const assert = require('node:assert/strict');

const ProductService = require('../service/ProductService');
const { ValidationError, NotFoundError } = require('../service/errors');
const InMemoryProductRepository = require('./InMemoryProductRepository');

function createService(rows = []) {
    return new ProductService(new InMemoryProductRepository(rows));
}

const milk = {
    id: 1,
    name: 'Молоко',
    description: '',
    price: 40,
    stock: 5
};

test('create: коректні дані', async () => {
    const service = createService();

    const product = await service.create({
        name: '  Хліб  ',
        price: 25.5,
        stock: 3
    });

    assert.deepEqual(product, {
        id: 1,
        name: 'Хліб',
        description: '',
        price: 25.5,
        stock: 3
    });

    assert.deepEqual(await service.get(1), product);
});

test('update: часткове оновлення', async () => {
    const service = createService([milk]);

    const updated = await service.update('1', { price: 45 });

    assert.equal(updated.price, 45);
    assert.equal(updated.name, 'Молоко');
    assert.equal(updated.stock, 5);
});

test('remove: видалення товару', async () => {
    const service = createService([milk]);

    await service.remove('1');

    await assert.rejects(
        service.get('1'),
        NotFoundError
    );
});

test('create: відсутнє поле name', async () => {
    const service = createService();

    await assert.rejects(
        service.create({ price: 10 }),
        error => {
            assert.ok(error instanceof ValidationError);
            assert.ok(error.details.some(d => d.field === 'name'));
            return true;
        }
    );

    assert.equal((await service.list()).length, 0);
});

test('create: некоректні price та stock', async () => {
    const service = createService();

    await assert.rejects(
        service.create({
            name: 'Тест',
            price: -1,
            stock: 1.5
        }),
        error => {
            const fields = error.details.map(d => d.field).sort();
            assert.deepEqual(fields, ['price', 'stock']);
            return true;
        }
    );
});

test('create: некоректне тіло запиту', async () => {
    const service = createService();

    for (const body of [undefined, null, 'text', []]) {
        await assert.rejects(
            service.create(body),
            error =>
                error instanceof ValidationError &&
                error.details[0].field === 'body'
        );
    }
});

test('update: порожній PATCH', async () => {
    const service = createService([milk]);

    await assert.rejects(
        service.update('1', {}),
        ValidationError
    );
});

test('get/update/remove: неіснуючий ID', async () => {
    const service = createService();

    await assert.rejects(service.get('99'), NotFoundError);

    await assert.rejects(
        service.update('99', { name: 'X' }),
        NotFoundError
    );

    await assert.rejects(service.remove('99'), NotFoundError);
});

test('get: некоректний ID', async () => {
    const service = createService([milk]);

    for (const id of ['abc', '0', '-5', '1.5', '']) {
        await assert.rejects(
            service.get(id),
            error =>
                error instanceof ValidationError &&
                error.details[0].field === 'id'
        );
    }
});
