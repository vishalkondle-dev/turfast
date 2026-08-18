import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Dev-only one-click login. Sends an OTP (captured in-memory when no mail key)
 * and immediately verifies it, returning the auth session cookies.
 * Disabled when MAIL_API_KEY is set OR NODE_ENV=production.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_LOGIN !== "1") {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const code = (globalThis as any).__DEV_OTP?.[email];
  if (!code) return NextResponse.json({ error: "no dev otp (set a mail key?)" }, { status: 400 });

  const res = await auth.api.signInEmailOTP({ body: { email, otp: code }, asResponse: true });
  // pass through Set-Cookie
  const out = NextResponse.json({ ok: true });
  res.headers.forEach((v, k) => { if (k.toLowerCase() === "set-cookie") out.headers.append("set-cookie", v); });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) out.headers.set("set-cookie", setCookie);
  return out;
}
