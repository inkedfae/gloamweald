import {
  assertStripeCheckoutConfigured,
  createStripeCheckoutSession,
  json,
  normaliseOrder,
  parseJsonBody,
} from "../../src/checkout-shared.js";

/*
  Cloudflare Pages route:
  /functions/api/create-stripe-session.js -> /api/create-stripe-session

  Stripe checkout uses a server-created hosted Checkout Session. The browser
  receives only the Stripe-hosted checkout URL; STRIPE_SECRET_KEY stays in
  Cloudflare Pages environment variables.
*/
export async function onRequestPost(context) {
  try {
    assertStripeCheckoutConfigured(context.env);
    const input = await parseJsonBody(context.request);
    const order = normaliseOrder(input);
    const origin = new URL(context.request.url).origin;
    const session = await createStripeCheckoutSession(context.env, order, {
      successUrl: `${origin}/success.html?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/cart.html?checkout=stripe-cancelled`,
    });

    if (!session.id || !session.url) {
      return json(400, { error: "Stripe did not return a hosted checkout URL." });
    }

    return json(200, {
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    return json(400, { error: error.message });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
