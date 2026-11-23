
const test = require('node:test');
const assert = require('node:assert/strict');

const IdempotencyStore = require('../middleware/idempotencyStore');

test('Новий ключ виконує операцію', async () => {
    const store = new IdempotencyStore();
    let calls = 0;

    const result = await store.execute(
        'key-1',
        { name: 'Test' },
        async () => {
            calls++;
            return { id: 1, name: 'Test' };
        }
    );

    assert.equal(calls, 1);
    assert.equal(result.replayed, false);
    assert.equal(result.result.id, 1);
});

test('Повторний ключ не виконує операцію вдруге', async () => {
    const store = new IdempotencyStore();
    let calls = 0;

    const action = async () => {
        calls++;
        return { id: 1, name: 'Test' };
    };

    await store.execute('key-1', { name: 'Test' }, action);

    const result = await store.execute(
        'key-1',
        { name: 'Test' },
        action
    );

    assert.equal(calls, 1);
    assert.equal(result.replayed, true);
    assert.equal(result.result.id, 1);
});

test('Однаковий ключ з іншими даними повертає конфлікт', async () => {
    const store = new IdempotencyStore();

    await store.execute(
        'key-1',
        { name: 'Test' },
        async () => ({ id: 1 })
    );

    const result = await store.execute(
        'key-1',
        { name: 'Different' },
        async () => ({ id: 2 })
    );

    assert.equal(result.conflict, true);
});

test('Одночасні запити з однаковим ключем створюють один товар', async () => {
    const store = new IdempotencyStore();
    let calls = 0;

    const action = async () => {
        calls++;
        await new Promise(resolve => setImmediate(resolve));
        return { id: 1, name: 'Test' };
    };

    const [first, second] = await Promise.all([
        store.execute('key-1', { name: 'Test' }, action),
        store.execute('key-1', { name: 'Test' }, action)
    ]);

    assert.equal(calls, 1);
    assert.equal(first.result.id, 1);
    assert.equal(second.result.id, 1);
    assert.equal(first.replayed, false);
    assert.equal(second.replayed, true);
});

test('Помилка операції дозволяє повторити запит', async () => {
    const store = new IdempotencyStore();
    let calls = 0;

    const action = async () => {
        calls++;

        if (calls === 1) {
            throw new Error('Temporary error');
        }

        return { id: 1 };
    };

    await assert.rejects(
        store.execute('key-1', { name: 'Test' }, action),
        /Temporary error/
    );

    const result = await store.execute(
        'key-1',
        { name: 'Test' },
        action
    );

    assert.equal(calls, 2);
    assert.equal(result.result.id, 1);
});
