/** Mail client for the logixsoft mail API. Falls back to console in dev when no key set. */

type SendArgs = { to: string; subject: string; html: string };

export async function sendMail({ to, subject, html }: SendArgs): Promise<{ ok: boolean; ref?: string; error?: string }> {
  const url = process.env.MAIL_API_URL || "https://mail.logixsoft.in/send-email";
  const key = process.env.MAIL_API_KEY;

  if (!key) {
    // Dev mode: no key configured — log instead of sending.
    console.log(`\n📧 [dev-mail] To: ${to}\n   Subject: ${subject}\n   (set MAIL_API_KEY to actually send)\n`);
    return { ok: true, ref: "dev-console" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({ to, subject, body: html }),
    });
    if (!res.ok) return { ok: false, error: `Mail API ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { messageId?: string };
    return { ok: true, ref: data.messageId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const shell = (title: string, inner: string) => `
<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;background:#0b0f14;color:#e6edf3;border-radius:16px;overflow:hidden;border:1px solid #1e2630">
  <div style="background:linear-gradient(135deg,#16a34a,#0ea5e9);padding:22px 24px">
    <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em">Turfast</div>
    <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:2px">${title}</div>
  </div>
  <div style="padding:24px">${inner}</div>
  <div style="padding:16px 24px;border-top:1px solid #1e2630;color:#7d8590;font-size:12px">
    Book Your Game. Own Your Time. · Turfast Sports Marketplace
  </div>
</div>`;

export function otpEmail(code: string) {
  return shell("Verify your email", `
    <p style="margin:0 0 12px;color:#c9d1d9">Use this one-time code to sign in. It expires in 10 minutes.</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:.4em;background:#111820;border:1px dashed #30363d;border-radius:12px;padding:18px;text-align:center;color:#fff">${code}</div>
    <p style="margin:16px 0 0;color:#7d8590;font-size:13px">If you didn't request this, you can safely ignore this email.</p>`);
}

export function bookingEmail(o: { name: string; venue: string; sport: string; when: string; code: string; amount: string }) {
  return shell("Booking confirmed 🎉", `
    <p style="margin:0 0 14px;color:#c9d1d9">Hi ${o.name}, your slot is locked in.</p>
    <table style="width:100%;font-size:14px;color:#c9d1d9">
      <tr><td style="padding:4px 0;color:#7d8590">Venue</td><td style="text-align:right">${o.venue}</td></tr>
      <tr><td style="padding:4px 0;color:#7d8590">Sport</td><td style="text-align:right">${o.sport}</td></tr>
      <tr><td style="padding:4px 0;color:#7d8590">When</td><td style="text-align:right">${o.when}</td></tr>
      <tr><td style="padding:4px 0;color:#7d8590">Booking ID</td><td style="text-align:right">${o.code}</td></tr>
      <tr><td style="padding:4px 0;color:#7d8590">Amount paid</td><td style="text-align:right;font-weight:700;color:#fff">${o.amount}</td></tr>
    </table>`);
}
