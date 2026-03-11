# QA E2E Test Matrix (Ready To Run)

Date baseline used: 2026-03-10

## Exact Expiry Dates

- EXPIRED: `2026-03-01`
- FINAL (<= 7 days): `2026-03-13` (3 days from baseline)
- URGENT (8-30 days): `2026-03-30` (20 days from baseline)
- WARNING (31-60 days): `2026-04-24` (45 days from baseline)
- VALID (> 60 days): `2026-12-31`

---

## Required Document Types (use exact names)

- Driver License
- SSN
- Work Permit
- Alcohol Sales Permit
- Food Safety Certificate

---

## Employee Setup

Create these six test employees (store IDs can be adjusted to valid values in your DB):

1. EMP001 - John Smith - Store 1
2. EMP002 - Maria Garcia - Store 1
3. EMP003 - Alex Johnson - Store 2
4. EMP004 - Priya Patel - Store 2
5. EMP005 - Ethan Lee - Store 3
6. EMP006 - Nora Kim - Store 3

---

## Document Assignment Matrix

### EMP001 (Final alert + missing)
- Driver License -> `2026-03-13` (FINAL)
- SSN -> `2026-12-31` (VALID)
- Work Permit -> `2026-12-31` (VALID)
- Alcohol Sales Permit -> MISSING
- Food Safety Certificate -> MISSING

### EMP002 (Non-compliant / expired)
- Driver License -> `2026-03-01` (EXPIRED)
- SSN -> `2026-12-31` (VALID)
- Work Permit -> MISSING
- Alcohol Sales Permit -> MISSING
- Food Safety Certificate -> MISSING

### EMP003 (Urgent 30-day)
- Driver License -> `2026-03-30` (URGENT)
- SSN -> `2026-12-31` (VALID)
- Work Permit -> `2026-12-31` (VALID)
- Alcohol Sales Permit -> `2026-12-31` (VALID)
- Food Safety Certificate -> `2026-12-31` (VALID)

### EMP004 (Warning 60-day + one missing)
- Driver License -> `2026-04-24` (WARNING)
- SSN -> `2026-12-31` (VALID)
- Work Permit -> `2026-12-31` (VALID)
- Alcohol Sales Permit -> `2026-12-31` (VALID)
- Food Safety Certificate -> MISSING

### EMP005 (Fully compliant)
- Driver License -> `2026-12-31` (VALID)
- SSN -> `2026-12-31` (VALID)
- Work Permit -> `2026-12-31` (VALID)
- Alcohol Sales Permit -> `2026-12-31` (VALID)
- Food Safety Certificate -> `2026-12-31` (VALID)

### EMP006 (Mostly missing)
- SSN -> `2026-12-31` (VALID)
- Driver License -> MISSING
- Work Permit -> MISSING
- Alcohol Sales Permit -> MISSING
- Food Safety Certificate -> MISSING

---

## Quick Upload Template

Use this upload template for each document:

```bash
curl -i -b "$COOKIE" -X POST "$BASE/api/documents/employee/<EMP_ID>" \
  -F "document=@$DOC_PATH" \
  -F "document_type=<DOC_TYPE>" \
  -F "issue_date=2024-01-01" \
  -F "expiry_date=<EXPIRY_DATE>"
```

Example:

```bash
curl -i -b "$COOKIE" -X POST "$BASE/api/documents/employee/1" \
  -F "document=@$DOC_PATH" \
  -F "document_type=Driver License" \
  -F "issue_date=2024-01-01" \
  -F "expiry_date=2026-03-13"
```

---

## Expected Dashboard Outcomes

- Final Alert card: >= 1 (EMP001)
- Urgent Alert card: >= 1 (EMP003)
- Warning Alert card: >= 1 (EMP004)
- Expired docs count: >= 1 (EMP002)
- Missing docs count: > 0 (EMP001/002/004/006)
- At least one fully compliant employee (EMP005)

---

## Important Note

If `/api/alerts` fails with `SQLITE_ERROR: no such column: d.document_type`, resolve the schema mismatch first (DB currently uses `documents.type` while alert query expects `documents.document_type`).
