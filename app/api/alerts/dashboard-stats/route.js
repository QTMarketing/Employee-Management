import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/server/supabase";
import { requireAuth } from "../../../../lib/server/requireAuth";
import { REQUIRED_DOCS, canonicalDocName } from "../../../../lib/server/compliance";

export async function GET(req) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const storeId = url.searchParams.get("store_id");

    let empQuery = supabase.from("employees").select("id,name,store_id");
    if (storeId) empQuery = empQuery.eq("store_id", Number(storeId));
    const { data: employees, error: empErr } = await empQuery;
    if (empErr) throw empErr;

    const employeeIds = (employees || []).map((e) => e.id);
    if (employeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_employees: 0,
          expiring_count: 0,
          expired_count: 0,
          missing_count: 0,
          non_compliant_employees: [],
        },
      });
    }

    const { data: docs, error: docsErr } = await supabase
      .from("documents")
      .select("id,employee_id,document_type,type,status")
      .in("employee_id", employeeIds);
    if (docsErr) throw docsErr;

    const presentByEmp = new Map();
    let expiringCount = 0;
    let expiredCount = 0;
    (docs || []).forEach((d) => {
      const set = presentByEmp.get(d.employee_id) || new Set();
      const canonical = canonicalDocName(d.document_type || d.type);
      if (canonical) set.add(canonical);
      presentByEmp.set(d.employee_id, set);
      if (d.status === "expiring") expiringCount += 1;
      if (d.status === "expired") expiredCount += 1;
    });

    const { data: alerts, error: alertsErr } = await supabase
      .from("alerts")
      .select("employee_id,alert_type,read,documents(document_type,type)")
      .eq("read", 0)
      .in("employee_id", employeeIds);
    if (alertsErr) throw alertsErr;

    const nonCompliantMap = {};
    let missingCount = 0;

    (employees || []).forEach((emp) => {
      const present = presentByEmp.get(emp.id) || new Set();
      const missing = REQUIRED_DOCS.filter((doc) => !present.has(doc));
      missingCount += missing.length;
      if (missing.length > 0) {
        nonCompliantMap[emp.id] = { id: emp.id, name: emp.name, missing, expired: [], expiring: [] };
      }
    });

    (alerts || []).forEach((a) => {
      if (!nonCompliantMap[a.employee_id]) {
        const name = employees.find((x) => x.id === a.employee_id)?.name || "Unknown";
        nonCompliantMap[a.employee_id] = { id: a.employee_id, name, missing: [], expired: [], expiring: [] };
      }
      const docName = a.documents?.document_type || a.documents?.type || "Unknown Document";
      if (a.alert_type === "expired") nonCompliantMap[a.employee_id].expired.push(docName);
      else nonCompliantMap[a.employee_id].expiring.push(docName);
    });

    return NextResponse.json({
      success: true,
      data: {
        total_employees: employees.length,
        expiring_count: expiringCount,
        expired_count: expiredCount,
        missing_count: missingCount,
        non_compliant_employees: Object.values(nonCompliantMap),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: error.message || "Failed to build dashboard stats" }, { status: 500 });
  }
}

