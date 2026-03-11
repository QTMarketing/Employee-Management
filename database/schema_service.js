const db = require('./db');

function resolveDocName(row) {
    return row.document_type || row.type || 'Unknown Document';
}

function parseDateOnly(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = String(dateStr).split('-').map(Number);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
}

// Service function to check document expirations and generate alerts
const initAlertScanning = () => {
    console.log('Running alert scan...');
    // 1. Mark documents as expired or expiring
    const sqlDocs = `
        UPDATE documents 
        SET status = CASE 
            WHEN date(expiry_date) < date('now') THEN 'expired'
            WHEN date(expiry_date) <= date('now', '+60 days') THEN 'expiring'
            ELSE 'valid'
        END
    `;
    db.run(sqlDocs, [], (err) => {
        if (err) console.error('Failed to update document statuses:', err.message);
    });

    // 2. Generate Alerts based on rules
    // Rule: expiring_60, expiring_30, expiring_7, expired

    // For simplicity, we compare difference in days between expiry_date and today
    // To prevent duplicate alerts for the exact same alert state, we could check if an unread alert already exists,
    // but a basic implementation inserting new alerts:

    const query = `
        SELECT id as document_id, employee_id, expiry_date, document_type, type
        FROM documents
        WHERE status IN ('expired', 'expiring')
    `;

    db.all(query, [], (err, rows) => {
        if (err) return console.error(err.message);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        rows.forEach(doc => {
            const expiry = parseDateOnly(doc.expiry_date);
            if (!expiry) return;
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            const docName = resolveDocName(doc);

            let alertType = null;
            let message = '';

            if (diffDays < 0) {
                alertType = 'expired';
                message = `${docName} has expired`;
            } else if (diffDays <= 7) {
                alertType = 'expiring_7';
                message = `${docName} expires in less than 7 days`;
            } else if (diffDays <= 30) {
                alertType = 'expiring_30';
                message = `${docName} expires in less than 30 days`;
            } else if (diffDays <= 60) {
                alertType = 'expiring_60';
                message = `${docName} expires in less than 60 days`;
            }

            if (alertType) {
                // Check if exact alert type already exists for this document to avoid spamming
                db.get(`SELECT id FROM alerts WHERE document_id = ? AND alert_type = ?`, [doc.document_id, alertType], (err, existingAlert) => {
                    if (!err && !existingAlert) {
                        db.run(`INSERT INTO alerts (employee_id, document_id, alert_type, message) VALUES (?, ?, ?, ?)`,
                            [doc.employee_id, doc.document_id, alertType, message]);
                    }
                });
            }
        });
    });
};

module.exports = { initAlertScanning };
