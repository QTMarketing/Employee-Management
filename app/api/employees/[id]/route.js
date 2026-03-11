import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/server/supabase";
import { requireAuth } from "../../../../lib/server/requireAuth";

export async function GET(_req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .select("id,name,employee_id,store_id,position,status,hire_date,email,phone,stores(store_number)")
      .eq("id", params.id)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json({ data: { ...data, store_number: data.stores?.store_number || null } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    const payload = {
      name: body.name,
      employee_id: body.employee_id,
      store_id: body.store_id || null,
      position: body.position,
      hire_date: body.hire_date,
      email: body.email || null,
      phone: body.phone || null,
      status: body.status || "active",
    };
    const { error } = await supabase.from("employees").update(payload).eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ message: "Employee updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("employees").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete employee" }, { status: 500 });
  }
}

