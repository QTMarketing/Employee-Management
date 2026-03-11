const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const { requireAuth } = require('./auth/session');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', requireAuth);
app.use('/api/employees', require('./routes/employees'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/document_types', require('./routes/document_types'));
app.use('/api/alerts', require('./routes/alerts'));



const cron = require('node-cron');
const { initAlertScanning } = require('./database/schema_service');

// Schedule background task to run every 24 hours at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running daily compliance background task...');
    if (typeof initAlertScanning === 'function') {
        initAlertScanning();
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
