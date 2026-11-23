
const { createHash } = require('node:crypto');

class IdempotencyStore {
    constructor() {
        this.records = new Map();
    }

    getHash(data) {
        const normalizedData = data ?? {};

        return createHash('sha256')
            .update(JSON.stringify(normalizedData))
            .digest('hex');
    }

    async execute(key, data, action) {
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
                result: await existing.result
            };
        }

        const pending = Promise.resolve().then(action);

        this.records.set(key, {
            hash,
            result: pending
        });

        try {
            const result = await pending;

            return {
                conflict: false,
                replayed: false,
                result
            };
        } catch (error) {
            this.records.delete(key);
            throw error;
        }
    }
}

module.exports = IdempotencyStore;
