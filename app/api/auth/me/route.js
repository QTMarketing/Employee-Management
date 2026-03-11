import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: user, error: "" });
}

