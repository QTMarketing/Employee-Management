import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/server/supabase";
import { requireAuth } from "../../../../lib/server/requireAuth";
import { REQUIRED_DOCS, canonicalDocName } from "../../../../lib/server/compliance";

function csvEscape(value) {
  const raw = value == null ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function getStatus(employee) {
  if (employee.expired.length > 0) return "non-compliant";
  if (employee.missing.length > 0) return "incomplete";
  if (employee.expiring.length > 0) return "at-risk";
  return "compliant";
}

function urgencyLabel(days) {
  if (days <= 7) return "7d";
  if (days <= 30) return "30d";
  return "60d";
}

export async function GET(req) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const storeId = url.searchParams.get("store_id");

    const supabase = getSupabaseAdmin();
    let employeesQuery = supabase
      .from("employees")
      .select("id,name,employee_id,position,store_id,stores(store_number)")
      .order("id", { ascending: true });
    if (storeId) employeesQuery = employeesQuery.eq("store_id", Number(storeId));

    const { data: employeeRows, error: empErr } = await employeesQuery;
    if (empErr) throw empErr;
    const employees = (employeeRows || []).map((row) => ({
      id: row.id,
      name: row.name,
      employee_id: row.employee_id,
      position: row.position || "",
      store: row.stores?.store_number || "Unassigned",
      store_id: row.store_id,
    }));

    const employeeIds = employees.map((e) => e.id);
    let documents = [];
    if (employeeIds.length > 0) {
      const { data: docRows, error: docErr } = await supabase
        .from("documents")
        .select("employee_id,document_type,type,expiry_date")
        .in("employee_id", employeeIds);
      if (docErr) throw docErr;
      documents = docRows || [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = employees.map((emp) => {
      const docs = documents.filter((d) => d.employee_id === emp.id);
      const presentRequired = new Set();
      const expired = new Set();
      const expiringMap = new Map();

      docs.forEach((doc) => {
        const canonical = canonicalDocName(doc.document_type || doc.type);
        const expiry = new Date(doc.expiry_date);
        expiry.setHours(0, 0, 0, 0);
        const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (REQUIRED_DOCS.includes(canonical)) presentRequired.add(canonical);
        if (days < 0 && canonical) expired.add(canonical);
        else if (days <= 60 && canonical) {
          const existing = expiringMap.get(canonical);
          if (existing === undefined || days < existing) expiringMap.set(canonical, days);
        }
      });

      const missing = REQUIRED_DOCS.filter((doc) => !presentRequired.has(doc));
      const expiring = Array.from(expiringMap.entries())
        .map(([doc, days]) => ({ doc, days }))
        .sort((a, b) => a.days - b.days);

      return {
        ...emp,
        missing,
        expired: Array.from(expired),
        expiring,
      };
    });

    const filtered = rows.filter((emp) => {
      if (!q) return true;
      const searchable = [
        emp.employee_id,
        emp.name,
        emp.position,
        emp.store,
        ...emp.missing,
        ...emp.expired,
        ...emp.expiring.map((x) => x.doc),
        getStatus(emp),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });

    const atRisk = filtered.filter(
      (e) => e.expired.length > 0 || e.missing.length > 0 || e.expiring.length > 0
    );

    const header = [
      "employee_db_id",
      "employee_id",
      "name",
      "store",
      "position",
      "status",
      "missing_docs",
      "expired_docs",
      "expiring_docs",
      "exported_at",
    ];
    const exportedAt = new Date().toISOString();
    const lines = [
      header.join(","),
      ...atRisk.map((emp) =>
        [
          emp.id,
          emp.employee_id,
          emp.name,
          emp.store,
          emp.position,
          getStatus(emp),
          emp.missing.join("; "),
          emp.expired.join("; "),
          emp.expiring.map((x) => `${x.doc}:${urgencyLabel(x.days)}`).join("; "),
          exportedAt,
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const csv = lines.join("\n");
    const filename = `risk-register-export-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to export risk register" }, { status: 500 });
  }
}

