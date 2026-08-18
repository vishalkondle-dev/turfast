import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { sendMail, otpEmail } from "@/lib/mail";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-me",
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "customer", input: false },
      status: { type: "string", defaultValue: "active", input: false },
      phone: { type: "string", required: false },
      referralCode: { type: "string", required: false, input: false },
      loyaltyPoints: { type: "number", defaultValue: 0, input: false },
    },
  },
  advanced: {
    database: { generateId: () => nanoid() },
  },
  emailAndPassword: { enabled: false },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp }) {
        // In dev (no mail key) stash the code so the UI / quick-login can surface it.
        if (!process.env.MAIL_API_KEY) {
          (globalThis as any).__DEV_OTP ??= {};
          (globalThis as any).__DEV_OTP[email] = otp;
        }
        await sendMail({ to: email, subject: `${otp} is your Turfast verification code`, html: otpEmail(otp) });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
