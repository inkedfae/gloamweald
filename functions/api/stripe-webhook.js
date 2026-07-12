import {
  json,
  sendStripeOrderEmailOnce,
  verifyStripeWebhookSignature,
} from "../../src/checkout-shared.js";

/*
  Cloudflare Pages route:
  /functions/api/stripe-webhook.js -> /api/stripe-webhook

  Configure this endpoint in Stripe Dashboard and set STRIPE_WEBHOOK_SECRET in
  Cloudflare Pages. The raw request body is verified before any event is trusted.
*/
export async function onRequestPost(context) {
  try {
    const rawBody = await context.request.text();
    const signature = context.request.headers.get("Stripe-Signature") || "";
    const event = await verifyStripeWebhookSignature(context.env, rawBody, signature);
    const session = event.data?.object;

    if (
      (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") &&
      session?.payment_status === "paid"
    ) {
      try {
        await sendStripeOrderEmailOnce(context.env, session);
      } catch (error) {
        return json(500, {
          received: false,
          error: "Stripe payment was confirmed, but the order email could not be sent. Stripe should retry this webhook.",
        });
      }
    }

    return json(200, { received: true });
  } catch (error) {
    return json(400, { received: false, error: error.message });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
