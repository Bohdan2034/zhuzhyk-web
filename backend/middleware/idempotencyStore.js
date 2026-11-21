
const { createHash } = require('node:crypto');

class IdempotencyStore {
    constructor() {
        this.records = new Map();
    }

    getHash(data) {
        return createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    execute(key, data, action) {
        const hash = this.getHash(data);
        const existing = this.records.get(key);

        if (existing) {
            if (existing.hash !== hash) {
                return {
                    conflict: true
                };
            }

            return {
                conflict: false,
                replayed: true,
                result: existing.result
            };
        }

        const result = action();

        this.records.set(key, {
            hash,
            result
        });

        return {
            conflict: false,
            replayed: false,
            result
        };
    }
}

module.exports = IdempotencyStore;

