
const test = require('node:test');
const assert = require('node:assert/strict');

const rateLimiter = require('../middleware/rateLimiter');

test('Rate Limiter дозволяє перші 8 запитів', () => {
    let allowed = 0;

    for (let i = 0; i < 8; i++) {
        const req = { ip: 'test-ip-allowed' };

        const res = {
            setHeader() { return this; },
            status() { return this; },
            json() { return this; }
        };

        rateLimiter(req, res, () => {
            allowed++;
        });
    }

    assert.equal(allowed, 8);
});

test('Rate Limiter блокує 9-й запит', () => {
    let statusCode = null;
    let retryAfter = null;

    for (let i = 0; i < 9; i++) {
        const req = {
            ip: 'test-ip-blocked',
            requestId: 'test-request-id'
        };

        const res = {
            setHeader(name, value) {
                if (name === 'Retry-After') {
                    retryAfter = value;
                }
                return this;
            },
            status(code) {
                statusCode = code;
                return this;
            },
            json() {
                return this;
            }
        };

        rateLimiter(req, res, () => {});
    }

    assert.equal(statusCode, 429);
    assert.equal(retryAfter, '2');
});
