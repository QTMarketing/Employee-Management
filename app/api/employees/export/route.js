import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/server/supabase";
import { requireAuth } from "../../../../lib/server/requireAuth";

function csvEscape(value) {
  const raw = value == null ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

export async function GET(req) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const storeId = url.searchParams.get("store_id");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("employees")
      .select("id,name,employee_id,store_id,position,status,hire_date,email,phone,stores(store_number)")
      .order("id", { ascending: true });

    if (storeId) {
      query = query.eq("store_id", Number(storeId));
    }

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data || []).map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      name: row.name,
      store_id: row.store_id,
      store_number: row.stores?.store_number || "",
      position: row.position || "",
      status: row.status || "",
      hire_date: row.hire_date || "",
      email: row.email || "",
      phone: row.phone || "",
    }));

    if (q) {
      rows = rows.filter((row) =>
        [
          row.employee_id,
          row.name,
          row.store_number,
          row.position,
          row.status,
          row.email,
          row.phone,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    const header = [
      "id",
      "employee_id",
      "name",
      "store_id",
      "store_number",
      "position",
      "status",
      "hire_date",
      "email",
      "phone",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(",")),
    ];
    const csv = lines.join("\n");

    const filename = `employees-export-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to export employees" }, { status: 500 });
  }
}

