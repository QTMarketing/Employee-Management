const express = require('express');
const router = express.Router();
const {
    createSession,
    getSessionToken,
    getSessionByToken,
    clearSession,
    setAuthCookie,
    clearAuthCookie,
} = require('../auth/session');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gravity.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ success: false, data: null, error: 'Email and password are required' });
    }
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, data: null, error: 'Invalid credentials' });
    }
    const user = { email: ADMIN_EMAIL, name: ADMIN_NAME, role: 'admin' };
    const token = createSession(user);
    setAuthCookie(res, token);
    res.json({ success: true, data: user, error: '' });
});

router.get('/me', (req, res) => {
    const token = getSessionToken(req);
    const session = getSessionByToken(token);
    if (!session) {
        return res.status(401).json({ success: false, data: null, error: 'Unauthorized' });
    }
    res.json({ success: true, data: session.user, error: '' });
});

router.post('/logout', (req, res) => {
    const token = getSessionToken(req);
    clearSession(token);
    clearAuthCookie(res);
    res.json({ success: true, data: null, error: '' });
});

module.exports = router;
