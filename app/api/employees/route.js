import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/server/supabase";
import { requireAuth } from "../../../lib/server/requireAuth";

export async function GET() {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .select("id,name,employee_id,store_id,position,status,hire_date,email,phone,stores(store_number)")
      .order("id", { ascending: true });
    if (error) throw error;

    const normalized = (data || []).map((row) => ({
      ...row,
      store_number: row.stores?.store_number || null,
    }));
    return NextResponse.json({ data: normalized });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { name, employee_id, store_id, position, hire_date, email, phone, status } = body || {};
    if (!name || !employee_id || !position || !hire_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const payload = {
      name,
      employee_id,
      store_id: store_id || null,
      position,
      hire_date,
      email: email || null,
      phone: phone || null,
      status: status || "active",
    };
    const { data, error } = await supabase.from("employees").insert(payload).select("id").single();
    if (error) throw error;
    return NextResponse.json({ data: { id: data.id, ...payload } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create employee" }, { status: 500 });
  }
}

