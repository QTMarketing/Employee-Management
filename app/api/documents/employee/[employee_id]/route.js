import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseStorageBucket } from "../../../../../lib/server/supabase";
import { requireAuth } from "../../../../../lib/server/requireAuth";
import { getAlertType, getDocStatus } from "../../../../../lib/server/compliance";

export async function GET(_req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("employee_id", params.employee_id)
      .order("expiry_date", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const form = await req.formData();
    const file = form.get("document");
    const document_type = form.get("document_type");
    const issue_date = form.get("issue_date");
    const expiry_date = form.get("expiry_date");

    if (!file || !document_type || !issue_date || !expiry_date) {
      return NextResponse.json({ success: false, error: "File, document_type, issue_date, and expiry_date are required" }, { status: 400 });
    }

    const status = getDocStatus(expiry_date);
    let file_url = "";

    // Try Supabase Storage first, fallback to placeholder URL.
    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseStorageBucket();
    try {
      const ext = String(file.name || "pdf").split(".").pop();
      const key = `employee-documents/${params.employee_id}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      const bytes = await file.arrayBuffer();
      const { error: upErr } = await supabase.storage.from(bucket).upload(key, bytes, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });
      if (!upErr) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
        file_url = pub.publicUrl || "";
      }
    } catch {
      // no-op, fallback below
    }
    if (!file_url) {
      file_url = `/uploads/${Date.now()}-${file.name || "document.pdf"}`;
    }

    const payload = {
      employee_id: Number(params.employee_id),
      document_type: String(document_type),
      type: String(document_type),
      file_url,
      issue_date: String(issue_date),
      expiry_date: String(expiry_date),
      status,
    };
    const { data, error } = await supabase.from("documents").insert(payload).select("*").single();
    if (error) throw error;

    const alertType = getAlertType(expiry_date);
    if (alertType) {
      const message =
        alertType === "expired"
          ? `${document_type} has expired`
          : alertType === "expiring_7"
          ? `${document_type} expires in less than 7 days`
          : alertType === "expiring_30"
          ? `${document_type} expires in less than 30 days`
          : `${document_type} expires in less than 60 days`;
      await supabase.from("alerts").insert({
        employee_id: Number(params.employee_id),
        document_id: data.id,
        alert_type: alertType,
        message,
      });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Failed to upload document" }, { status: 500 });
  }
}

