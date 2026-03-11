#!/usr/bin/env bash
set -euo pipefail

# QA E2E command runner for Employee Management & Compliance System
# Uses the matrix in QA_E2E_TEST_MATRIX.md
#
# Usage:
#   1) Ensure app is running: npm run dev
#   2) Update DOC_PATH below to a real PDF path
#   3) Run: bash QA_E2E_COMMANDS.sh

BASE="http://localhost:3000"
COOKIE="./cookies.txt"

# Credentials (override via env if needed)
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@gravity.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

# Store IDs (adjust if your DB uses different ids)
STORE_1="${STORE_1:-1}"
STORE_2="${STORE_2:-2}"
STORE_3="${STORE_3:-3}"

# Reuse one valid PDF for all uploads
DOC_PATH="${DOC_PATH:-$HOME/Downloads/mock-driver-license.pdf}"

# Dates (baseline from QA_E2E_TEST_MATRIX.md)
DATE_FINAL="2026-03-13"
DATE_URGENT="2026-03-30"
DATE_WARNING="2026-04-24"
DATE_VALID="2026-12-31"
ISSUE_DATE="2024-01-01"

echo "== Preflight =="
if [[ ! -f "$DOC_PATH" ]]; then
  echo "ERROR: DOC_PATH does not exist: $DOC_PATH"
  echo "Create a PDF and set DOC_PATH first."
  exit 1
fi
echo "Using DOC_PATH=$DOC_PATH"
rm -f "$COOKIE"

login() {
  echo "== Login =="
  curl -sS -c "$COOKIE" "$BASE/api/auth/login" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" > /tmp/qa_login.json
  node -e "const r=require('fs').readFileSync('/tmp/qa_login.json','utf8');const j=JSON.parse(r);if(!j.success){console.error('Login failed:',j.error||j);process.exit(1)};console.log('Login OK as',j.data?.email||'unknown')"
}

create_employee() {
  local name="$1"
  local emp_code="$2"
  local store_id="$3"
  local position="$4"
  local status="$5"
  local hire_date="$6"
  local email="$7"
  local phone="$8"

  local payload
  payload=$(cat <<EOF
{
  "name":"$name",
  "employee_id":"$emp_code",
  "store_id":$store_id,
  "position":"$position",
  "status":"$status",
  "hire_date":"$hire_date",
  "email":"$email",
  "phone":"$phone"
}
EOF
)
  local res
  res=$(curl -sS -b "$COOKIE" "$BASE/api/employees" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$payload")

  node -e "const j=JSON.parse(process.argv[1]);if(!j.data?.id){console.error('Create employee failed:',j.error||j);process.exit(1)};console.log(j.data.id)" "$res"
}

upload_doc() {
  local emp_id="$1"
  local doc_type="$2"
  local expiry="$3"
  curl -sS -b "$COOKIE" -X POST "$BASE/api/documents/employee/$emp_id" \
    -F "document=@$DOC_PATH" \
    -F "document_type=$doc_type" \
    -F "issue_date=$ISSUE_DATE" \
    -F "expiry_date=$expiry" > /tmp/qa_upload.json
  node -e "const j=JSON.parse(require('fs').readFileSync('/tmp/qa_upload.json','utf8')); if(j.success===false){console.error('Upload failed:',j.error||j);process.exit(1)}; console.log('Uploaded:',j.data?.document_type||'unknown','-> emp',j.data?.employee_id||'?','expiry',j.data?.expiry_date||'?')"
}

verify_api() {
  echo "== Verify APIs =="
  echo "-- /api/employees"
  curl -sS -b "$COOKIE" "$BASE/api/employees" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const n=(j.data||[]).length;console.log('employees:',n)})"

  echo "-- /api/alerts"
  # If schema mismatch exists (type vs document_type), this may fail with sqlite error.
  curl -sS -b "$COOKIE" "$BASE/api/alerts" || true
  echo

  echo "-- /api/alerts/dashboard-stats"
  curl -sS -b "$COOKIE" "$BASE/api/alerts/dashboard-stats" || true
  echo
}

echo "== Start E2E Seed =="
login

echo "== Create 6 employees =="
E1=$(create_employee "John Smith" "EMP001" "$STORE_1" "Cashier" "active" "2023-06-15" "john.smith@gravity.local" "555-0101")
E2=$(create_employee "Maria Garcia" "EMP002" "$STORE_1" "Store Manager" "pending" "2024-01-10" "maria.garcia@gravity.local" "555-0102")
E3=$(create_employee "Alex Johnson" "EMP003" "$STORE_2" "Shift Lead" "suspended" "2022-11-20" "alex.johnson@gravity.local" "555-0103")
E4=$(create_employee "Priya Patel" "EMP004" "$STORE_2" "Food Prep" "active" "2021-05-12" "priya.patel@gravity.local" "555-0104")
E5=$(create_employee "Ethan Lee" "EMP005" "$STORE_3" "Supervisor" "active" "2020-09-03" "ethan.lee@gravity.local" "555-0105")
E6=$(create_employee "Nora Kim" "EMP006" "$STORE_3" "Cashier" "pending" "2025-01-18" "nora.kim@gravity.local" "555-0106")

echo "Employee IDs created: E1=$E1 E2=$E2 E3=$E3 E4=$E4 E5=$E5 E6=$E6"

echo "== Upload docs by matrix =="
# EMP001
upload_doc "$E1" "Driver License" "$DATE_FINAL"
upload_doc "$E1" "SSN" "$DATE_VALID"
upload_doc "$E1" "Work Permit" "$DATE_VALID"

# EMP002
# API requires future expiry on upload. We force one expired record after uploads.
upload_doc "$E2" "Driver License" "$DATE_FINAL"
upload_doc "$E2" "SSN" "$DATE_VALID"

# EMP003
upload_doc "$E3" "Driver License" "$DATE_URGENT"
upload_doc "$E3" "SSN" "$DATE_VALID"
upload_doc "$E3" "Work Permit" "$DATE_VALID"
upload_doc "$E3" "Alcohol Sales Permit" "$DATE_VALID"
upload_doc "$E3" "Food Safety Certificate" "$DATE_VALID"

# EMP004
upload_doc "$E4" "Driver License" "$DATE_WARNING"
upload_doc "$E4" "SSN" "$DATE_VALID"
upload_doc "$E4" "Work Permit" "$DATE_VALID"
upload_doc "$E4" "Alcohol Sales Permit" "$DATE_VALID"

# EMP005
upload_doc "$E5" "Driver License" "$DATE_VALID"
upload_doc "$E5" "SSN" "$DATE_VALID"
upload_doc "$E5" "Work Permit" "$DATE_VALID"
upload_doc "$E5" "Alcohol Sales Permit" "$DATE_VALID"
upload_doc "$E5" "Food Safety Certificate" "$DATE_VALID"

# EMP006
upload_doc "$E6" "SSN" "$DATE_VALID"

echo "== Force one expired document for alert testing =="
sqlite3 "database/database.sqlite" \
  "UPDATE documents
   SET expiry_date = date('now', '-1 day'),
       status = 'expired'
   WHERE employee_id = $E2
     AND (document_type = 'Driver License' OR type = 'Driver License')
   LIMIT 1;"
node -e "require('./database/schema_service').initAlertScanning(); console.log('Alert scan triggered after forcing expired document')"

verify_api

echo
echo "== Done =="
echo "Open dashboard and validate cards/tier counts/risk table."
echo "If /api/alerts fails with SQLITE_ERROR no such column d.document_type, align DB schema first."
echo
echo "Created employee IDs (for cleanup if needed):"
echo "$E1 $E2 $E3 $E4 $E5 $E6"
