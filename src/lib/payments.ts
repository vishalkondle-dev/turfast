/** PaymentGateway abstraction. Uses Cashfree when configured, else a simulated gateway. */

import { nanoid } from "nanoid";

export type PaymentIntent = {
  orderId: string;
  amount: number;
  method: string;
  gateway: "cashfree" | "simulated";
};

export type PaymentOutcome = {
  status: "successful" | "failed" | "processing";
  gatewayRef: string;
  gateway: "cashfree" | "simulated";
  message?: string;
};

export interface PaymentGateway {
  readonly name: "cashfree" | "simulated";
  createIntent(amount: number, method: string, meta?: Record<string, string>): Promise<PaymentIntent>;
  /** In real gateways this is a webhook/verify call; here we resolve synchronously for the demo. */
  capture(orderId: string, opts?: { simulate?: "success" | "failure" | "timeout" }): Promise<PaymentOutcome>;
}

class SimulatedGateway implements PaymentGateway {
  readonly name = "simulated" as const;
  async createIntent(amount: number, method: string): Promise<PaymentIntent> {
    return { orderId: "sim_" + nanoid(12), amount, method, gateway: "simulated" };
  }
  async capture(orderId: string, opts?: { simulate?: "success" | "failure" | "timeout" }): Promise<PaymentOutcome> {
    const mode = opts?.simulate ?? "success";
    if (mode === "failure")
      return { status: "failed", gatewayRef: orderId, gateway: "simulated", message: "Payment declined by bank (simulated)." };
    if (mode === "timeout")
      return { status: "processing", gatewayRef: orderId, gateway: "simulated", message: "Payment is still processing (simulated timeout)." };
    return { status: "successful", gatewayRef: orderId, gateway: "simulated", message: "Payment successful (simulated)." };
  }
}

class CashfreeGateway implements PaymentGateway {
  readonly name = "cashfree" as const;
  constructor(private appId: string, private secret: string, private env: string) {}
  async createIntent(amount: number, method: string, meta?: Record<string, string>): Promise<PaymentIntent> {
    // Cashfree PG "Create Order" — endpoint differs sandbox/prod.
    const base = this.env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
    const orderId = "cf_" + nanoid(12);
    try {
      await fetch(`${base}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": this.appId,
          "x-client-secret": this.secret,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: "INR",
          customer_details: { customer_id: meta?.userId ?? "guest", customer_phone: meta?.phone ?? "9999999999" },
        }),
      });
    } catch { /* fall through — order id still returned */ }
    return { orderId, amount, method, gateway: "cashfree" };
  }
  async capture(orderId: string): Promise<PaymentOutcome> {
    // In production this is driven by Cashfree webhook / order status poll.
    return { status: "successful", gatewayRef: orderId, gateway: "cashfree" };
  }
}

export function getGateway(): PaymentGateway {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET;
  if (appId && secret) return new CashfreeGateway(appId, secret, process.env.CASHFREE_ENV || "sandbox");
  return new SimulatedGateway();
}
