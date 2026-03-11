import { NextResponse } from "next/server";
import { createSessionCookie } from "../../../../lib/server/session";
import { getAdminCredentials } from "../../../../lib/server/supabase";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, data: null, error: "Email and password are required" }, { status: 400 });
    }
    const admin = getAdminCredentials();
    if (email !== admin.email || password !== admin.password) {
      return NextResponse.json({ success: false, data: null, error: "Invalid credentials" }, { status: 401 });
    }
    const user = { email: admin.email, name: admin.name, role: "admin" };
    await createSessionCookie(user);
    return NextResponse.json({ success: true, data: user, error: "" });
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Invalid request body" }, { status: 400 });
  }
}

