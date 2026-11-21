const { ValidationError, NotFoundError } = require('../service/errors');

// Єдиний формат помилки: { error, code, details? }
function sendError(res, status, error, code, details) {
    const body = { error, code };

    if (details) {
        body.details = details;
    }

    return res.status(status).json(body);
}

function notFoundHandler(req, res) {
    sendError(res, 404, 'NotFound', 'ROUTE_NOT_FOUND', [
        { field: 'path', message: `Маршрут ${req.method} ${req.path} не існує` }
    ]);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ValidationError) {
        return sendError(res, 400, 'ValidationError', 'VALIDATION_FAILED', err.details);
    }

    if (err instanceof NotFoundError) {
        return sendError(res, 404, 'NotFound', `${err.resource.toUpperCase()}_NOT_FOUND`, [
            { field: 'id', message: `Ресурс з ID ${err.id} не знайдено` }
        ]);
    }

    // Помилки body-parser (express.json)
    if (err.type === 'entity.parse.failed') {
        return sendError(res, 400, 'BadRequest', 'INVALID_JSON', [
            { field: 'body', message: 'Некоректний JSON' }
        ]);
    }

    if (err.type === 'entity.too.large') {
        return sendError(res, 413, 'BadRequest', 'PAYLOAD_TOO_LARGE');
    }

    if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
        return sendError(res, err.status, 'BadRequest', 'BAD_REQUEST');
    }

    console.error(err);
    return sendError(res, 500, 'InternalError', 'INTERNAL_ERROR');
}

module.exports = { errorHandler, notFoundHandler };
