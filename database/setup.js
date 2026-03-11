const db = require('./db');

const setupDatabase = () => {
    db.serialize(() => {
        // 1. Stores Table
        db.run(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_number TEXT UNIQUE NOT NULL,
        region TEXT NOT NULL,
        manager_id INTEGER,
        address TEXT NOT NULL
      )
    `);

        // 2. Employees Table
        db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        employee_id TEXT UNIQUE NOT NULL,
        store_id INTEGER,
        position TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        hire_date DATE NOT NULL,
        email TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      )
    `);

        // 3. DocumentTypes Table
        db.run(`
      CREATE TABLE IF NOT EXISTS document_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        required BOOLEAN DEFAULT 0
      )
    `);

        // 4. Documents Table
        db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'valid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

        // 5. Alerts Table
        db.run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        document_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT 0,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

        // Seed Data for Document Types
        const defaultDocTypes = [
            { name: 'Driver License', required: 1 },
            { name: 'SSN', required: 1 },
            { name: 'Work Permit', required: 1 },
            { name: 'Alcohol Sales Permit', required: 1 },
            { name: 'Food Safety Certificate', required: 1 }
        ];

        db.get('SELECT count(*) as count FROM document_types', [], (err, row) => {
            if (!err && row.count === 0) {
                const stmt = db.prepare('INSERT INTO document_types (name, required) VALUES (?, ?)');
                defaultDocTypes.forEach(dt => {
                    stmt.run(dt.name, dt.required);
                });
                stmt.finalize();
                console.log('Seeded document_types.');
            }
        });

        // Seed Data for Stores
        db.get('SELECT count(*) as count FROM stores', [], (err, row) => {
            if (!err && row.count === 0) {
                const stmt = db.prepare('INSERT INTO stores (store_number, region, manager_id, address) VALUES (?, ?, ?, ?)');
                stmt.run('STR-001', 'Northwest', null, '123 Pine St, Seattle, WA');
                stmt.run('STR-002', 'Southwest', null, '456 Oak Rd, Phoenix, AZ');
                stmt.run('STR-003', 'East Coast', null, '789 Maple Ave, Boston, MA');
                stmt.finalize();
                console.log('Seeded stores.');
            }
        });

    });

    // Give queries a moment to finish seeding before closing (simple timeout for sqlite serialize)
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database v2 setup complete. Connection closed.');
            }
        });
    }, 1000);
};

setupDatabase();
