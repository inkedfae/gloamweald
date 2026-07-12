import {
  json,
  requireEnv,
  retrieveStripeCheckoutSession,
} from "../../src/checkout-shared.js";

/*
  Cloudflare Pages route:
  /functions/api/confirm-stripe-session.js -> /api/confirm-stripe-session

  The success page calls this after Stripe redirects back. It confirms payment
  status server-side before the browser clears the cart or shows success.
*/
export async function onRequestGet(context) {
  try {
    requireEnv(context.env, "STRIPE_SECRET_KEY");
    const sessionId = new URL(context.request.url).searchParams.get("session_id") || "";
    const session = await retrieveStripeCheckoutSession(context.env, sessionId);

    if (session.status !== "complete" || session.payment_status !== "paid") {
      return json(400, {
        paid: false,
        error: "Stripe payment has not been confirmed as paid.",
        status: session.status || "",
        paymentStatus: session.payment_status || "",
      });
    }

    return json(200, {
      paid: true,
      provider: "stripe",
      sessionID: session.id,
      paymentIntent: session.payment_intent || "",
      customerEmail: session.customer_details?.email || "",
    });
  } catch (error) {
    return json(400, { paid: false, error: error.message });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
