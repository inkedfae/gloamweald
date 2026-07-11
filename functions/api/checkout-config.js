import { json } from "../../src/checkout-shared.js";

/*
  Cloudflare Pages route:
  /functions/api/checkout-config.js -> /api/checkout-config

  This endpoint returns only public checkout configuration.
  It must never return PAYPAL_CLIENT_SECRET, RESEND_API_KEY, or CONTACT_EMAIL.
*/
export async function onRequestGet(context) {
  const paypalClientId = context.env?.PAYPAL_CLIENT_ID || "";
  const paypalEnv = context.env?.PAYPAL_ENV || "sandbox";

  if (!paypalClientId) {
    return json(200, {
      configured: false,
      currency: "AUD",
      paypalEnv,
      error: "PayPal checkout is not configured yet.",
    });
  }

  return json(200, {
    configured: true,
    paypalClientId,
    currency: "AUD",
    paypalEnv,
  });
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
