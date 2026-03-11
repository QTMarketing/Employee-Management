import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/server/supabase";
import { requireAuth } from "../../../lib/server/requireAuth";

export async function GET() {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("stores").select("*").order("id", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch stores" }, { status: 500 });
  }
}

