export const REQUIRED_DOCS = [
  "Driver License",
  "SSN",
  "Work Permit",
  "Alcohol Sales Permit",
  "Food Safety Certificate",
];

const DOC_ALIAS_MAP = {
  "driver license": "Driver License",
  "drivers license": "Driver License",
  driver_license: "Driver License",
  ssn: "SSN",
  "social security number": "SSN",
  "social security": "SSN",
  work_permit: "Work Permit",
  "work permit": "Work Permit",
  alcohol_permit: "Alcohol Sales Permit",
  "alcohol permit": "Alcohol Sales Permit",
  "alcohol sales permit": "Alcohol Sales Permit",
  food_safety_certificate: "Food Safety Certificate",
  "food safety certificate": "Food Safety Certificate",
};

export function normalizeDocName(value = "") {
  return String(value).trim().toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ");
}

export function canonicalDocName(value = "") {
  const normalized = normalizeDocName(value);
  return DOC_ALIAS_MAP[normalized] || value || "";
}

export function getDocStatus(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 60) return "expiring";
  return "valid";
}

export function getAlertType(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "expiring_7";
  if (diffDays <= 30) return "expiring_30";
  if (diffDays <= 60) return "expiring_60";
  return null;
}

