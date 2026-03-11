const express = require('express');
const router = express.Router();
const db = require('../database/db');

const REQUIRED_DOCS = [
    'Driver License',
    'SSN',
    'Work Permit',
    'Alcohol Sales Permit',
    'Food Safety Certificate',
];

const DOC_ALIAS_MAP = {
    'driver license': 'Driver License',
    'drivers license': 'Driver License',
    driver_license: 'Driver License',
    ssn: 'SSN',
    'social security number': 'SSN',
    'social security': 'SSN',
    work_permit: 'Work Permit',
    'work permit': 'Work Permit',
    alcohol_permit: 'Alcohol Sales Permit',
    'alcohol permit': 'Alcohol Sales Permit',
    'alcohol sales permit': 'Alcohol Sales Permit',
    food_safety_certificate: 'Food Safety Certificate',
    'food safety certificate': 'Food Safety Certificate',
};

function normalizeDocName(value = '') {
    return String(value).trim().toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');
}

function canonicalDocName(value = '') {
    const normalized = normalizeDocName(value);
    return DOC_ALIAS_MAP[normalized] || value || '';
}

// Get all alerts (with employee and document info)
router.get('/', (req, res) => {
    const query = `
        SELECT 
            a.id, a.alert_type, a.message, a.created_at, a.read,
            e.name as employee_name, e.id as employee_id,
            COALESCE(d.document_type, d.type) as document_type
        FROM alerts a
        JOIN employees e ON a.employee_id = e.id
        JOIN documents d ON a.document_id = d.id
        ORDER BY a.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Structure them like the previous implementation for the dashboard UI
        const alerts = {
            expired: [],
            expiring7: [],
            expiring30: [],
            expiring60: [],
            all: rows
        };

        rows.forEach(alert => {
            if (alert.alert_type === 'expired') alerts.expired.push(alert);
            else if (alert.alert_type === 'expiring_7') alerts.expiring7.push(alert);
            else if (alert.alert_type === 'expiring_30') alerts.expiring30.push(alert);
            else if (alert.alert_type === 'expiring_60') alerts.expiring60.push(alert);
        });

        res.json({ data: alerts });
    });
});

// Mark alert as read
router.patch('/:id/read', (req, res) => {
    const id = req.params.id;
    db.run('UPDATE alerts SET read = 1 WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Alert marked as read' });
    });
});

// Dashboard stats: Missing documents & Non-compliant employees
router.get('/dashboard-stats', (req, res) => {
    const storeId = req.query.store_id || null;
    const params = storeId ? [storeId] : [];

    // SQLite boolean handles
    const empWhere = storeId ? 'WHERE e.store_id = ?' : '';
    const joinWhere = storeId ? 'WHERE e.store_id = ? AND' : 'WHERE';
    const alertWhere = storeId ? 'AND e.store_id = ?' : '';

    const queries = {
        totalEmp: `SELECT count(*) as count FROM employees e ${empWhere}`,
        expiringDocs: `
            SELECT count(*) as count FROM documents d 
            JOIN employees e ON d.employee_id = e.id 
            ${joinWhere} d.status = 'expiring'
        `,
        expiredDocs: `
            SELECT count(*) as count FROM documents d 
            JOIN employees e ON d.employee_id = e.id 
            ${joinWhere} d.status = 'expired'
        `,
        activeAlerts: `
            SELECT a.employee_id, e.name as employee_name, a.alert_type, COALESCE(d.document_type, d.type) as document_type
            FROM alerts a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN documents d ON a.document_id = d.id
            WHERE a.read = 0 ${alertWhere}
        `,
        employeeDocs: `
            SELECT e.id as employee_id, e.name as employee_name, COALESCE(d.document_type, d.type) as document_type
            FROM employees e
            LEFT JOIN documents d ON e.id = d.employee_id
            ${storeId ? 'WHERE e.store_id = ?' : ''}
        `
    };

    db.get(queries.totalEmp, params, (err, empRes) => {
        db.get(queries.expiringDocs, params, (err, expiringRes) => {
            db.get(queries.expiredDocs, params, (err, expiredRes) => {
                db.all(queries.employeeDocs, params, (err, docsRes) => {
                    db.all(queries.activeAlerts, params, (err, alertsRes) => {
                        const nonCompliantMap = {};
                        const presentByEmployee = new Map();
                        const nameByEmployee = new Map();

                        (docsRes || []).forEach((row) => {
                            nameByEmployee.set(row.employee_id, row.employee_name);
                            if (!presentByEmployee.has(row.employee_id)) {
                                presentByEmployee.set(row.employee_id, new Set());
                            }
                            const canonical = canonicalDocName(row.document_type);
                            if (canonical && REQUIRED_DOCS.includes(canonical)) {
                                presentByEmployee.get(row.employee_id).add(canonical);
                            }
                        });

                        let missingCount = 0;
                        Array.from(nameByEmployee.entries()).forEach(([employeeId, employeeName]) => {
                            const present = presentByEmployee.get(employeeId) || new Set();
                            const missing = REQUIRED_DOCS.filter((doc) => !present.has(doc));
                            missingCount += missing.length;
                            if (missing.length > 0) {
                                nonCompliantMap[employeeId] = {
                                    id: employeeId,
                                    name: employeeName,
                                    missing,
                                    expired: [],
                                    expiring: [],
                                };
                            }
                        });

                        (alertsRes || []).forEach(row => {
                            if (!nonCompliantMap[row.employee_id]) nonCompliantMap[row.employee_id] = { id: row.employee_id, name: row.employee_name, missing: [], expired: [], expiring: [] };

                            if (row.alert_type === 'expired') {
                                nonCompliantMap[row.employee_id].expired.push(row.document_type || 'Unknown Document');
                            } else {
                                nonCompliantMap[row.employee_id].expiring.push(row.document_type || 'Unknown Document');
                            }
                        });

                        res.json({
                            success: true,
                            data: {
                                total_employees: empRes?.count || 0,
                                expiring_count: expiringRes?.count || 0,
                                expired_count: expiredRes?.count || 0,
                                missing_count: missingCount,
                                non_compliant_employees: Object.values(nonCompliantMap)
                            }
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
