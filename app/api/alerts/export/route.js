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
    const read = url.searchParams.get("read");
    const alertType = url.searchParams.get("alert_type");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("alerts")
      .select("id,alert_type,message,created_at,read,employee_id,document_id,employees(name),documents(document_type,type)")
      .order("created_at", { ascending: false });
    if (read === "true") query = query.eq("read", true);
    if (read === "false") query = query.eq("read", false);
    if (alertType) query = query.eq("alert_type", alertType);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((r) => ({
      alert_id: r.id,
      created_at: r.created_at,
      employee_id: r.employee_id,
      employee_name: r.employees?.name || "Unknown",
      alert_type: r.alert_type,
      document_type: r.documents?.document_type || r.documents?.type || "Unknown Document",
      message: r.message,
      read: r.read ? 1 : 0,
    }));

    const header = [
      "alert_id",
      "created_at",
      "employee_id",
      "employee_name",
      "alert_type",
      "document_type",
      "message",
      "read",
    ];

    const lines = [
      header.join(","),
      ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(",")),
    ];
    const csv = lines.join("\n");
    const filename = `compliance-alerts-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to export alerts" }, { status: 500 });
  }
}

