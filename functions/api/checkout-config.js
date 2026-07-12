import { json, stripeCheckoutConfigured } from "../../src/checkout-shared.js";

/*
  Cloudflare Pages route:
  /functions/api/checkout-config.js -> /api/checkout-config

  This endpoint returns only public checkout configuration.
  It must never return PAYPAL_CLIENT_SECRET, STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, or CONTACT_EMAIL.
*/
export async function onRequestGet(context) {
  const paypalClientId = context.env?.PAYPAL_CLIENT_ID || "";
  const paypalEnv = context.env?.PAYPAL_ENV || "sandbox";
  const stripeConfigured = stripeCheckoutConfigured(context.env);

  if (!paypalClientId) {
    return json(200, {
      configured: false,
      paypalConfigured: false,
      stripeConfigured,
      currency: "AUD",
      paypalEnv,
      error: "PayPal checkout is not configured yet.",
      stripeError: stripeConfigured
        ? ""
        : "Stripe checkout is not fully configured in Cloudflare yet.",
    });
  }

  return json(200, {
    configured: true,
    paypalConfigured: true,
    stripeConfigured,
    paypalClientId,
    currency: "AUD",
    paypalEnv,
    stripeError: stripeConfigured
      ? ""
      : "Stripe checkout is not fully configured in Cloudflare yet.",
  });
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
