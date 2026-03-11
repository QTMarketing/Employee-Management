const express = require('express');
const router = express.Router();
const db = require('../database/db');

function getEmployeeSchema(callback) {
    db.all('PRAGMA table_info(employees)', [], (err, rows) => {
        if (err) return callback(err);
        const columns = new Set((rows || []).map((r) => r.name));
        callback(null, {
            hasStoreId: columns.has('store_id'),
            hasLegacyStore: columns.has('store'),
            hasEmail: columns.has('email'),
            hasPhone: columns.has('phone'),
            hasStatus: columns.has('status')
        });
    });
}

function resolveLegacyStoreValue(inputStore, callback) {
    if (!inputStore) return callback(null, null);
    const asNumber = Number(inputStore);
    if (Number.isNaN(asNumber)) return callback(null, inputStore);
    db.get('SELECT store_number FROM stores WHERE id = ?', [asNumber], (err, row) => {
        if (err) return callback(err);
        callback(null, row?.store_number || String(inputStore));
    });
}

// Get all employees with store info
router.get('/', (req, res) => {
    getEmployeeSchema((schemaErr, schema) => {
        if (schemaErr) return res.status(500).json({ error: schemaErr.message });
        const query = schema.hasStoreId
            ? `
                SELECT e.*, s.store_number
                FROM employees e
                LEFT JOIN stores s ON e.store_id = s.id
            `
            : `
                SELECT e.*, e.store AS store_number
                FROM employees e
            `;
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows });
        });
    });
});

// Get single employee
router.get('/:id', (req, res) => {
    const id = req.params.id;
    getEmployeeSchema((schemaErr, schema) => {
        if (schemaErr) return res.status(500).json({ error: schemaErr.message });
        const query = schema.hasStoreId
            ? `
                SELECT e.*, s.store_number
                FROM employees e
                LEFT JOIN stores s ON e.store_id = s.id
                WHERE e.id = ?
            `
            : `
                SELECT e.*, e.store AS store_number
                FROM employees e
                WHERE e.id = ?
            `;
        db.get(query, [id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Employee not found' });
            res.json({ data: row });
        });
    });
});

// Create employee
router.post('/', (req, res) => {
    const { name, employee_id, store_id, store, position, hire_date, email, phone, status } = req.body;
    if (!name || !employee_id || !position || !hire_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    getEmployeeSchema((schemaErr, schema) => {
        if (schemaErr) return res.status(500).json({ error: schemaErr.message });

        if (schema.hasStoreId) {
            if (!store_id) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const sql = `INSERT INTO employees (name, employee_id, store_id, position, hire_date, email, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [name, employee_id, store_id, position, hire_date, email || null, phone || null, status || 'active'];
            db.run(sql, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ data: { id: this.lastID, ...req.body, status: status || 'active' } });
            });
            return;
        }

        if (!schema.hasLegacyStore) {
            return res.status(500).json({ error: 'Employee schema is missing store/store_id column' });
        }

        resolveLegacyStoreValue(store || store_id, (storeErr, legacyStore) => {
            if (storeErr) return res.status(500).json({ error: storeErr.message });
            if (!legacyStore) return res.status(400).json({ error: 'Missing required fields' });
            const sql = schema.hasStatus
                ? `INSERT INTO employees (name, employee_id, store, position, hire_date, status) VALUES (?, ?, ?, ?, ?, ?)`
                : `INSERT INTO employees (name, employee_id, store, position, hire_date) VALUES (?, ?, ?, ?, ?)`;
            const params = schema.hasStatus
                ? [name, employee_id, legacyStore, position, hire_date, status || 'active']
                : [name, employee_id, legacyStore, position, hire_date];
            db.run(sql, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ data: { id: this.lastID, ...req.body, store_number: legacyStore, status: status || 'active' } });
            });
        });
    });
});

// Update employee
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { name, employee_id, store_id, store, position, hire_date, email, phone, status } = req.body;

    getEmployeeSchema((schemaErr, schema) => {
        if (schemaErr) return res.status(500).json({ error: schemaErr.message });

        if (schema.hasStoreId) {
            const sql = `UPDATE employees SET name = ?, employee_id = ?, store_id = ?, position = ?, hire_date = ?, email = ?, phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            const params = [name, employee_id, store_id, position, hire_date, email, phone, status, id];
            db.run(sql, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Employee not found' });
                res.json({ message: 'Employee updated successfully' });
            });
            return;
        }

        if (!schema.hasLegacyStore) {
            return res.status(500).json({ error: 'Employee schema is missing store/store_id column' });
        }

        resolveLegacyStoreValue(store || store_id, (storeErr, legacyStore) => {
            if (storeErr) return res.status(500).json({ error: storeErr.message });
            const sql = schema.hasStatus
                ? `UPDATE employees SET name = ?, employee_id = ?, store = ?, position = ?, hire_date = ?, status = ? WHERE id = ?`
                : `UPDATE employees SET name = ?, employee_id = ?, store = ?, position = ?, hire_date = ? WHERE id = ?`;
            const params = schema.hasStatus
                ? [name, employee_id, legacyStore, position, hire_date, status, id]
                : [name, employee_id, legacyStore, position, hire_date, id];
            db.run(sql, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Employee not found' });
                res.json({ message: 'Employee updated successfully' });
            });
        });
    });
});

// Delete employee
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM employees WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully' });
    });
});

module.exports = router;
