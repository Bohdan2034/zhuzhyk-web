
const test = require('node:test');
const assert = require('node:assert/strict');

const IdempotencyStore = require('../middleware/idempotencyStore');

test('Новий ключ виконує операцію', () => {
    const store = new IdempotencyStore();
    let calls = 0;

    const result = store.execute(
        'key-1',
        { name: 'Test' },
        () => {
            calls++;
            return { id: 1, name: 'Test' };
        }
    );

    assert.equal(calls, 1);
    assert.equal(result.replayed, false);
    assert.equal(result.result.id, 1);
});

test('Повторний ключ не виконує операцію вдруге', () => {
    const store = new IdempotencyStore();
    let calls = 0;

    const action = () => {
        calls++;
        return { id: 1, name: 'Test' };
    };

    store.execute('key-1', { name: 'Test' }, action);

    const result = store.execute(
        'key-1',
        { name: 'Test' },
        action
    );

    assert.equal(calls, 1);
    assert.equal(result.replayed, true);
    assert.equal(result.result.id, 1);
});

test('Однаковий ключ з іншими даними повертає конфлікт', () => {
    const store = new IdempotencyStore();

    store.execute(
        'key-1',
        { name: 'Test' },
        () => ({ id: 1 })
    );

    const result = store.execute(
        'key-1',
        { name: 'Different' },
        () => ({ id: 2 })
    );

    assert.equal(result.conflict, true);
});
