import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "documents";
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@gravity.local",
    password: process.env.ADMIN_PASSWORD || "admin123",
    name: process.env.ADMIN_NAME || "Admin User",
  };
}

