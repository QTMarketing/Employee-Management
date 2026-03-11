import { NextResponse } from "next/server";
import { getSessionUser } from "./session";

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, unauthorized: NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, unauthorized: null };
}

