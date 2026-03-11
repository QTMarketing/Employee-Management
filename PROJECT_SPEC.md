# Employee Management & Compliance System

## Goal
Build an internal system to track employee documentation and prevent compliance violations by monitoring document expiration dates.

## Users

Admin
- full access to system

HR
- manage employees
- upload documents

Store Manager
- view employees in their store
- see compliance alerts

## Core Features

### Employee Profiles
Each employee has:
- name
- employee_id
- store
- position
- hire_date
- status

### Document Management
Employees can upload documents including:
- driver license
- work permit
- alcohol sales permit
- food safety certificate
- background check

Documents store:
- file_url
- issue_date
- expiry_date

### Expiration Tracking
System automatically detects documents:

- expiring in 60 days
- expiring in 30 days
- expiring in 7 days
- expired

### Compliance Dashboard
Shows:

- missing documents
- expiring documents
- expired documents
- compliance by store