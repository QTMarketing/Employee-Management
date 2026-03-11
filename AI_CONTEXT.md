# AI Context: Employee Management & Compliance System

## Project Overview
[cite_start]This system is designed for gas stations to track employee documentation and prevent compliance violations[cite: 3, 9, 11]. [cite_start]It monitors expiration dates for high-stakes documents like alcohol permits and food safety certificates[cite: 6, 7, 32, 33].

## Tech Stack & Standards
- **Framework:** Next.js with React functional components.
- **Styling:** Tailwind CSS.
- **Icons:** Lucide-react.
- [cite_start]**Storage:** Secure S3 buckets for PDF and Image uploads[cite: 35, 36, 37, 38].
- **API Standard:** All responses should follow the `{ success: boolean, data: any, error: string }` format.

## Business & Compliance Logic
- [cite_start]**Required Documents:** Every employee must eventually have a Driver License, Social Security, Work Permit, Alcohol Sales Permit, Food Safety Certificate, and Background Check[cite: 29, 30, 31, 32, 33, 8].
- [cite_start]**Expiration Alerts:** Calculations must follow this strict schedule[cite: 43, 44]:
  - First Warning: 60 days before expiry.
  - Second Warning: 30 days before expiry.
  - Final Warning: 7 days before expiry.
- [cite_start]**Employee Statuses:** Use only: Active, Suspended, Terminated, or Pending Documentation[cite: 55, 56, 57, 58, 59].
- **Data Privacy:** Store Managers can only view employees belonging to their assigned `store_id`. [cite_start]Admins have global access[cite: 16, 61, 62].

## Database Integrity
- Refer to `DATABASE_SCHEMA.md` for the primary structure.
- [cite_start]Always include `issue_date` and `expiry_date` for every document record[cite: 80, 81].
- Use ISO 8601 strings for all date storage and comparisons.

## Prompting Instructions
- Explain the logic behind any date calculations or compliance status changes.
- [cite_start]Ensure the "Compliance Dashboard" correctly flags "Missing" vs "Expired" documents as per Section 4.4 of the PRD[cite: 45, 47, 48].