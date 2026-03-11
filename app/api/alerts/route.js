import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/server/supabase";
import { requireAuth } from "../../../lib/server/requireAuth";

export async function GET() {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("alerts")
      .select("id,alert_type,message,created_at,read,employee_id,document_id,employees(name),documents(document_type,type)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data || []).map((r) => ({
      id: r.id,
      alert_type: r.alert_type,
      message: r.message,
      created_at: r.created_at,
      read: r.read,
      employee_name: r.employees?.name || "Unknown",
      employee_id: r.employee_id,
      document_type: r.documents?.document_type || r.documents?.type || "Unknown Document",
    }));

    const alerts = { expired: [], expiring7: [], expiring30: [], expiring60: [], all: rows };
    rows.forEach((a) => {
      if (a.alert_type === "expired") alerts.expired.push(a);
      else if (a.alert_type === "expiring_7") alerts.expiring7.push(a);
      else if (a.alert_type === "expiring_30") alerts.expiring30.push(a);
      else if (a.alert_type === "expiring_60") alerts.expiring60.push(a);
    });
    return NextResponse.json({ data: alerts });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch alerts" }, { status: 500 });
  }
}

