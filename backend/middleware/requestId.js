
const { randomUUID } = require('node:crypto');

function requestId(req, res, next) {
    const incomingId = req.get('X-Request-Id');

    const id =
        incomingId && /^[a-zA-Z0-9_-]{1,100}$/.test(incomingId)
            ? incomingId
            : randomUUID();

    req.requestId = id;

    res.setHeader('X-Request-Id', id);

    next();
}

module.exports = requestId;
