import { NextRequest, NextResponse } from "next/server";

// Dev helper: reveal the last OTP generated for an email (only when no mail key set).
export async function GET(req: NextRequest) {
  if (process.env.MAIL_API_KEY) return NextResponse.json({});
  const email = req.nextUrl.searchParams.get("email") || "";
  const code = (globalThis as any).__DEV_OTP?.[email];
  return NextResponse.json({ code: code ?? null });
}
