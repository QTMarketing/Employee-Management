import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/server/supabase";
import { requireAuth } from "../../../lib/server/requireAuth";

function normalizeStore(row) {
  return {
    ...row,
    name: row.name || row.region || `Store ${row.store_number || row.id}`,
    location: row.location || row.address || row.region || "N/A",
  };
}

export async function GET() {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("stores").select("*").order("id", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data: (data || []).map(normalizeStore) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch stores" }, { status: 500 });
  }
}

export async function POST(req) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const store_number = String(body?.store_number || "").trim();
    const name = String(body?.name || "").trim();
    const location = String(body?.location || "").trim();

    if (!store_number) {
      return NextResponse.json({ error: "Store number is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // First attempt: modern columns (name/location)
    const primaryPayload = {
      store_number,
      name: name || `Store ${store_number}`,
      location: location || "N/A",
    };
    const primary = await supabase.from("stores").insert(primaryPayload).select("*").single();
    if (!primary.error) {
      return NextResponse.json({ data: normalizeStore(primary.data) }, { status: 201 });
    }

    // Fallback: legacy columns (region/address)
    const fallbackPayload = {
      store_number,
      region: name || "General",
      address: location || "N/A",
    };
    const fallback = await supabase.from("stores").insert(fallbackPayload).select("*").single();
    if (fallback.error) throw fallback.error;
    return NextResponse.json({ data: normalizeStore(fallback.data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create store" }, { status: 500 });
  }
}

