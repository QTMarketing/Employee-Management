const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all document types
router.get('/', (req, res) => {
    db.all('SELECT * FROM document_types', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

module.exports = router;
