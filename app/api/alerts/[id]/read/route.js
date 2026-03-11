import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/server/supabase";
import { requireAuth } from "../../../../../lib/server/requireAuth";

export async function PATCH(_req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("alerts").update({ read: true }).eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ message: "Alert marked as read" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update alert" }, { status: 500 });
  }
}

