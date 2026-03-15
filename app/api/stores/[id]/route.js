import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/server/supabase";
import { requireAuth } from "../../../../lib/server/requireAuth";

export async function DELETE(_req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const storeId = Number(params.id);
    if (!storeId) {
      return NextResponse.json({ error: "Invalid store id" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { count, error: empErr } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);
    if (empErr) throw empErr;

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete store with assigned employees. Reassign or remove employees first." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("stores").delete().eq("id", storeId);
    if (error) throw error;
    return NextResponse.json({ message: "Store deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete store" }, { status: 500 });
  }
}

