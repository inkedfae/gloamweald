import {
  assertCheckoutConfigured,
  json,
  parseJsonBody,
  paypalAccessToken,
  paypalBaseUrl,
  paypalOrderPayload,
  signOrder,
} from "../../src/checkout-shared.js";
import { normaliseOrder } from "../../src/checkout-order.js";

/*
  Cloudflare Pages route:
  /functions/api/create-paypal-order.js -> /api/create-paypal-order

  Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, RESEND_API_KEY, and CONTACT_EMAIL in:
  Cloudflare Dashboard -> Workers & Pages -> this Pages project -> Settings -> Variables and Secrets.
*/
export async function onRequestPost(context) {
  try {
    assertCheckoutConfigured(context.env);
    const input = await parseJsonBody(context.request);
    const order = normaliseOrder(input);
    const accessToken = await paypalAccessToken(context.env);

    const response = await fetch(`${paypalBaseUrl(context.env)}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": order.reference,
      },
      body: JSON.stringify(paypalOrderPayload(order)),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(response.status, {
        error: data.message || data.name || "PayPal order could not be created.",
        details: data.details || [],
      });
    }

    order.paypalOrderId = data.id;

    return json(200, {
      id: data.id,
      orderToken: await signOrder(context.env, order),
    });
  } catch (error) {
    return json(400, { error: error.message });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
