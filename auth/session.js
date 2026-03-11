const crypto = require('crypto');

const SESSION_COOKIE = 'gravity_auth';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const sessions = new Map();

function parseCookies(cookieHeader = '') {
    return cookieHeader
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((acc, part) => {
            const idx = part.indexOf('=');
            if (idx === -1) return acc;
            const key = part.slice(0, idx);
            const val = part.slice(idx + 1);
            acc[key] = decodeURIComponent(val);
            return acc;
        }, {});
}

function getSessionToken(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    return cookies[SESSION_COOKIE] || null;
}

function createSession(user) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, {
        user,
        expiresAt: Date.now() + SESSION_TTL_MS,
    });
    return token;
}

function getSessionByToken(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
        sessions.delete(token);
        return null;
    }
    return session;
}

function clearSession(token) {
    if (token) sessions.delete(token);
}

function setAuthCookie(res, token) {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
        'Set-Cookie',
        `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${isProd ? '; Secure' : ''}`
    );
}

function clearAuthCookie(res) {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
        'Set-Cookie',
        `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`
    );
}

function requireAuth(req, res, next) {
    const token = getSessionToken(req);
    const session = getSessionByToken(token);
    if (!session) {
        return res.status(401).json({ success: false, data: null, error: 'Unauthorized' });
    }
    req.auth = session.user;
    next();
}

module.exports = {
    SESSION_COOKIE,
    createSession,
    getSessionToken,
    getSessionByToken,
    clearSession,
    setAuthCookie,
    clearAuthCookie,
    requireAuth,
};
