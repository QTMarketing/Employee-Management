const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database/db');
const fs = require('fs');
const { initAlertScanning } = require('../database/schema_service');

require('dotenv').config();

// AWS SDK
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// S3 config
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock'
    }
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mock-bucket';
const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_access_key';

// If not using S3, ensure local uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!useS3 && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Memory storage for S3 uploads or local disk fallback
const storage = useS3 ? multer.memoryStorage() : multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Image files are allowed.'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

function getDocumentsSchema(callback) {
    db.all('PRAGMA table_info(documents)', [], (err, rows) => {
        if (err) return callback(err);
        const columns = new Set((rows || []).map((r) => r.name));
        callback(null, {
            hasType: columns.has('type'),
            hasDocumentType: columns.has('document_type'),
            hasStatus: columns.has('status'),
        });
    });
}

// Get all documents for an employee
router.get('/employee/:employee_id', (req, res) => {
    const employeeId = req.params.employee_id;
    db.all('SELECT * FROM documents WHERE employee_id = ? ORDER BY expiry_date ASC', [employeeId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Upload document
router.post('/employee/:employee_id', upload.single('document'), async (req, res) => {
    const employeeId = req.params.employee_id;
    const { document_type, issue_date, expiry_date } = req.body;

    if (!req.file || !document_type || !issue_date || !expiry_date) {
        return res.status(400).json({ success: false, error: 'File, document_type, issue_date, and expiry_date are required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiry_date);

    if (expiry <= today) {
        return res.status(400).json({ success: false, error: 'Expiry date must be in the future for new uploads' });
    }

    let fileUrl = '';

    if (useS3) {
        const fileKey = `employee-documents/${employeeId}/${document_type}-${Date.now()}${path.extname(req.file.originalname)}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });

        try {
            await s3Client.send(command);
            fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            return res.status(500).json({ error: 'Failed to upload to S3' });
        }
    } else {
        fileUrl = `/uploads/${req.file.filename}`;
    }

    // Determine status
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    let status = 'valid';
    if (diffDays < 0) status = 'expired';
    else if (diffDays <= 60) status = 'expiring';

    getDocumentsSchema((schemaErr, schema) => {
        if (schemaErr) return res.status(500).json({ error: schemaErr.message });

        if (!schema.hasType && !schema.hasDocumentType) {
            return res.status(500).json({ error: 'Documents schema missing type/document_type column' });
        }

        const columns = ['employee_id'];
        const params = [employeeId];

        if (schema.hasType) {
            columns.push('type');
            params.push(document_type);
        }
        if (schema.hasDocumentType) {
            columns.push('document_type');
            params.push(document_type);
        }

        columns.push('file_url');
        params.push(fileUrl);

        columns.push('issue_date');
        params.push(issue_date);

        columns.push('expiry_date');
        params.push(expiry_date);

        if (schema.hasStatus) {
            columns.push('status');
            params.push(status);
        }

        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO documents (${columns.join(', ')}) VALUES (${placeholders})`;

        db.run(sql, params, function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Trigger alert scan after insertion
            if (typeof initAlertScanning === 'function') {
                initAlertScanning();
            }

            res.status(201).json({
                success: true,
                data: {
                    id: this.lastID, employee_id: employeeId, document_type, file_url: fileUrl, issue_date, expiry_date, status
                }
            });
        });
    });
});

// Delete a document
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT file_url FROM documents WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Document not found' });

        if (!row.file_url.startsWith('http')) {
            const filePath = path.join(__dirname, '..', row.file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        db.run('DELETE FROM documents WHERE id = ?', [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Document deleted successfully' });
        });
    });
});

module.exports = router;
