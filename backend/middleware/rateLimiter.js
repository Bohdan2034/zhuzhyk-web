
const requests = new Map();

const WINDOW_MS = 10_000;
const MAX_REQUESTS = 8;
const RETRY_AFTER_SECONDS = 2;

function rateLimiter(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'local';
    const now = Date.now();

    const previous = requests.get(ip);

    let state;

    if (!previous || now - previous.timestamp >= WINDOW_MS) {
        state = {
            count: 1,
            timestamp: now
        };
    } else {
        state = {
            count: previous.count + 1,
            timestamp: previous.timestamp
        };
    }

    requests.set(ip, state);

    if (state.count > MAX_REQUESTS) {
        return res
            .setHeader('Retry-After', String(RETRY_AFTER_SECONDS))
            .status(429)
            .json({
                error: 'TooManyRequests',
                code: 'RATE_LIMIT_EXCEEDED',
                requestId: req.requestId
            });
    }

    next();
}

module.exports = rateLimiter;
