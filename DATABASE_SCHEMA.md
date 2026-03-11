# DATABASE_SCHEMA.md

## Overview
This document defines the database structure for the Employee Management & Compliance System.

The system tracks employees, their documents, expiration dates, and store assignments to ensure regulatory compliance.

Database should be designed so it can run on SQLite for development and PostgreSQL for production.

---

# Tables

## Employees

Stores employee profile information.

| Field | Type | Description |
|------|------|-------------|
id | UUID / INTEGER | Primary key |
name | TEXT | Employee full name |
employee_id | TEXT | Unique employee identifier |
store_id | INTEGER | Reference to store |
position | TEXT | Job position |
status | TEXT | active / suspended / terminated / pending_documents |
hire_date | DATE | Employee hire date |
email | TEXT | Employee email |
phone | TEXT | Employee phone |
created_at | TIMESTAMP | Record creation time |
updated_at | TIMESTAMP | Record last update |

---

## Stores

Represents physical store locations.

| Field | Type | Description |
|------|------|-------------|
id | INTEGER | Primary key |
store_number | TEXT | Unique store identifier |
region | TEXT | Store region |
manager_id | INTEGER | Employee ID of store manager |
address | TEXT | Store address |

---

## Documents

Stores compliance documents uploaded for employees.

| Field | Type | Description |
|------|------|-------------|
id | UUID / INTEGER | Primary key |
employee_id | INTEGER | Reference to employee |
document_type | TEXT | Type of document |
file_url | TEXT | Location of uploaded file |
issue_date | DATE | Document issue date |
expiry_date | DATE | Document expiration date |
status | TEXT | valid / expiring / expired |
created_at | TIMESTAMP | Record creation time |

---

## DocumentTypes

Defines the allowed document types in the system.

| Field | Type | Description |
|------|------|-------------|
id | INTEGER | Primary key |
name | TEXT | Document type name |
required | BOOLEAN | Whether document is mandatory |

Example values:

- driver_license
- work_permit
- alcohol_permit
- food_safety_certificate
- background_check
- training_certificate

---

## Alerts

Stores system alerts for compliance issues.

| Field | Type | Description |
|------|------|-------------|
id | INTEGER | Primary key |
employee_id | INTEGER | Related employee |
document_id | INTEGER | Related document |
alert_type | TEXT | expiring_60 / expiring_30 / expiring_7 / expired / missing |
message | TEXT | Alert message |
created_at | TIMESTAMP | Alert creation time |
read | BOOLEAN | Whether alert has been viewed |

---

# Relationships

Employees → Stores  
Many employees belong to one store.

Employees → Documents  
One employee can have multiple documents.

Documents → Alerts  
Documents can generate alerts when approaching expiration.

---

# Expiration Logic

The system should detect documents that are:

- expiring within **60 days**
- expiring within **30 days**
- expiring within **7 days**
- **expired**

These states should update the document status automatically.

---

# File Storage

Documents should not be stored directly in the database.

Only store the **file_url**.

Files should be uploaded to cloud storage (S3 or similar).

Example path:

employee-documents/{employee_id}/{document_type}.pdf