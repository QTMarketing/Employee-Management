import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseStorageBucket } from "../../../../lib/server/supabase";
import { requireAuth } from "../../../../lib/server/requireAuth";

export async function DELETE(_req, { params }) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data: doc, error: fetchErr } = await supabase.from("documents").select("*").eq("id", params.id).single();
    if (fetchErr) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc?.file_url && doc.file_url.includes("/storage/v1/object/public/")) {
      try {
        const marker = "/storage/v1/object/public/";
        const idx = doc.file_url.indexOf(marker);
        if (idx !== -1) {
          const remainder = doc.file_url.slice(idx + marker.length);
          const slash = remainder.indexOf("/");
          if (slash !== -1) {
            const bucket = remainder.slice(0, slash);
            const key = remainder.slice(slash + 1);
            await supabase.storage.from(bucket).remove([key]);
          }
        }
      } catch {
        // storage cleanup best effort
      }
    }

    const { error } = await supabase.from("documents").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete document" }, { status: 500 });
  }
}

