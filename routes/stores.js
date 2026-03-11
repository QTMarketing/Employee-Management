const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all stores
router.get('/', (req, res) => {
    db.all('SELECT * FROM stores', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

module.exports = router;
