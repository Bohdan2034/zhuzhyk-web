// Помилки рівня service/. Вони не знають про HTTP —
// у статус-коди їх перетворює api/errorHandler.js.

class ValidationError extends Error {
    constructor(details) {
        super('Validation failed');
        this.name = 'ValidationError';
        this.details = details; // [{ field, message }]
    }
}

class NotFoundError extends Error {
    constructor(resource, id) {
        super(`${resource} ${id} not found`);
        this.name = 'NotFoundError';
        this.resource = resource;
        this.id = id;
    }
}

module.exports = { ValidationError, NotFoundError };
