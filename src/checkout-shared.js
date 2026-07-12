/*
  Cloudflare Pages Functions checkout helper.

  Set these in Cloudflare Dashboard:
  Workers & Pages -> your Pages project -> Settings -> Variables and Secrets.

  Required production/preview variables for PayPal checkout:
  - PAYPAL_CLIENT_ID
  - PAYPAL_CLIENT_SECRET
  - RESEND_API_KEY
  - CONTACT_EMAIL

  Required production/preview variables for Stripe checkout:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - RESEND_API_KEY
  - CONTACT_EMAIL

  Optional:
  - PAYPAL_ENV=sandbox or live; defaults to sandbox
  - RESEND_FROM; defaults to Resend's onboarding sender until a domain sender is configured

  Never put PAYPAL_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
  or RESEND_API_KEY in frontend HTML/JS/CSS.
*/

const CURRENCY = "AUD";
const BRAND_NAME = "GLOAMWEALD";

export function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function safeText(value, maxLength = 400) {
  return String(value || "").trim().slice(0, maxLength);
}

function moneyValue(amount) {
  return Number(amount || 0).toFixed(2);
}

function stripeMinorAmount(amount) {
  return Math.round(Number(amount || 0) * 100);
}

export function requireEnv(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is not configured in Cloudflare Pages environment variables.`);
  return value;
}

export function assertCheckoutConfigured(env) {
  requireEnv(env, "PAYPAL_CLIENT_ID");
  requireEnv(env, "PAYPAL_CLIENT_SECRET");
  requireEnv(env, "RESEND_API_KEY");
  requireEnv(env, "CONTACT_EMAIL");
}

export function assertStripeCheckoutConfigured(env) {
  requireEnv(env, "STRIPE_SECRET_KEY");
  requireEnv(env, "STRIPE_WEBHOOK_SECRET");
  requireEnv(env, "RESEND_API_KEY");
  requireEnv(env, "CONTACT_EMAIL");
}

export function stripeCheckoutConfigured(env) {
  return Boolean(env?.STRIPE_SECRET_KEY && env?.STRIPE_WEBHOOK_SECRET && env?.RESEND_API_KEY && env?.CONTACT_EMAIL);
}

export function paypalBaseUrl(env) {
  return env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const binary = atob(padded.replaceAll("-", "+").replaceAll("_", "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacBase64Url(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const bytes = new Uint8Array(signature);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

export async function signOrder(env, order) {
  const payload = base64UrlEncode(JSON.stringify(order));
  const signature = await hmacBase64Url(requireEnv(env, "PAYPAL_CLIENT_SECRET"), payload);
  return `${payload}.${signature}`;
}

export async function verifyOrderToken(env, token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) throw new Error("Order token is missing.");

  const expected = await hmacBase64Url(requireEnv(env, "PAYPAL_CLIENT_SECRET"), payload);
  if (!constantTimeEqual(signature, expected)) {
    throw new Error("Order token could not be verified.");
  }

  return JSON.parse(base64UrlDecode(payload));
}

export async function paypalAccessToken(env) {
  const credentials = btoa(`${requireEnv(env, "PAYPAL_CLIENT_ID")}:${requireEnv(env, "PAYPAL_CLIENT_SECRET")}`);

  const response = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || "PayPal access token request failed.");
  }
  return data.access_token;
}

export function paypalOrderPayload(order) {
  const purchaseUnit = {
    reference_id: order.reference,
    invoice_id: order.reference,
    custom_id: order.reference,
    description: `GLOAMWEALD order ${order.reference}`,
    amount: {
      currency_code: CURRENCY,
      value: moneyValue(order.total),
      breakdown: {
        item_total: {
          currency_code: CURRENCY,
          value: moneyValue(order.subtotal),
        },
        shipping: {
          currency_code: CURRENCY,
          value: moneyValue(order.shipping.amount),
        },
      },
    },
    items: order.items.map((item) => ({
      name: item.name,
      quantity: String(item.quantity),
      category: "PHYSICAL_GOODS",
      unit_amount: {
        currency_code: CURRENCY,
        value: moneyValue(item.unitAmount),
      },
    })),
    shipping: {
      name: {
        full_name: order.customer.name,
      },
      address: {
        address_line_1: order.customer.address1,
        address_line_2: order.customer.address2,
        admin_area_2: order.customer.city,
        admin_area_1: order.customer.state,
        postal_code: order.customer.postcode,
        country_code: "AU",
      },
    },
  };

  return {
    intent: "CAPTURE",
    purchase_units: [purchaseUnit],
    payment_source: {
      paypal: {
        experience_context: {
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          payment_method_selected: "PAYPAL",
          brand_name: BRAND_NAME,
          shipping_preference: "SET_PROVIDED_ADDRESS",
          user_action: "PAY_NOW",
        },
      },
    },
  };
}

function appendStripeField(form, key, value) {
  if (value === null || value === undefined || value === "") return;
  form.append(key, String(value));
}

function appendStripeLineItem(form, index, item) {
  appendStripeField(form, `line_items[${index}][quantity]`, item.quantity);
  appendStripeField(form, `line_items[${index}][price_data][currency]`, CURRENCY.toLowerCase());
  appendStripeField(form, `line_items[${index}][price_data][unit_amount]`, stripeMinorAmount(item.unitAmount));
  appendStripeField(form, `line_items[${index}][price_data][product_data][name]`, item.name);
}

function splitMetadataValue(value, prefix, metadata, maxParts = 4) {
  const text = safeText(value, 500 * maxParts);
  for (let index = 0; index < maxParts; index += 1) {
    const chunk = text.slice(index * 500, (index + 1) * 500);
    if (chunk) metadata[`${prefix}_${index + 1}`] = chunk;
  }
}

function stripeMetadataForOrder(order) {
  const metadata = {
    reference: order.reference,
    customer_name: order.customer.name,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone,
    shipping_id: order.shippingId,
    shipping_label: order.shipping.label,
    shipping_amount: moneyValue(order.shipping.amount),
    subtotal: moneyValue(order.subtotal),
    total: moneyValue(order.total),
    currency: CURRENCY,
    address1: order.customer.address1,
    address2: order.customer.address2,
    city: order.customer.city,
    state: order.customer.state,
    postcode: order.customer.postcode,
    country: order.customer.country,
  };

  splitMetadataValue(
    order.items.map((item) => `${item.quantity} x ${item.name} - $${moneyValue(item.lineTotal)} ${CURRENCY}`).join("\n"),
    "items",
    metadata,
  );
  splitMetadataValue(order.notes || "None", "notes", metadata);

  return Object.fromEntries(
    Object.entries(metadata)
      .map(([key, value]) => [key, safeText(value, 500)])
      .filter(([, value]) => value),
  );
}

export function stripeCheckoutSessionForm(order, { successUrl, cancelUrl }) {
  const form = new URLSearchParams();

  appendStripeField(form, "mode", "payment");
  appendStripeField(form, "success_url", successUrl);
  appendStripeField(form, "cancel_url", cancelUrl);
  appendStripeField(form, "client_reference_id", order.reference);
  appendStripeField(form, "customer_email", order.customer.email);
  appendStripeField(form, "payment_method_types[0]", "card");
  appendStripeField(form, "submit_type", "pay");

  order.items.forEach((item, index) => {
    appendStripeLineItem(form, index, item);
  });

  if (order.shipping.amount > 0) {
    appendStripeLineItem(form, order.items.length, {
      name: order.shipping.label,
      quantity: 1,
      unitAmount: order.shipping.amount,
    });
  }

  Object.entries(stripeMetadataForOrder(order)).forEach(([key, value]) => {
    appendStripeField(form, `metadata[${key}]`, value);
    appendStripeField(form, `payment_intent_data[metadata][${key}]`, value);
  });

  return form;
}

async function stripeApiRequest(env, path, options = {}) {
  const headers = {
    Authorization: `Bearer ${requireEnv(env, "STRIPE_SECRET_KEY")}`,
    ...options.headers,
  };

  const response = await fetch(`https://api.stripe.com/v1/${path.replace(/^\/+/, "")}`, {
    method: options.method || "GET",
    headers,
    body: options.body,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Stripe request failed.");
  }

  return data;
}

export async function createStripeCheckoutSession(env, order, urls) {
  return stripeApiRequest(env, "checkout/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": order.reference,
    },
    body: stripeCheckoutSessionForm(order, urls),
  });
}

export async function retrieveStripeCheckoutSession(env, sessionId) {
  const id = safeText(sessionId, 200);
  if (!id.startsWith("cs_")) throw new Error("Stripe Checkout Session ID is missing.");
  return stripeApiRequest(env, `checkout/sessions/${encodeURIComponent(id)}`);
}

export async function updateStripeCheckoutSessionMetadata(env, sessionId, metadata) {
  const id = safeText(sessionId, 200);
  if (!id.startsWith("cs_")) throw new Error("Stripe Checkout Session ID is missing.");

  const form = new URLSearchParams();
  Object.entries(metadata).forEach(([key, value]) => {
    appendStripeField(form, `metadata[${key}]`, value);
  });

  return stripeApiRequest(env, `checkout/sessions/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
}

export async function verifyStripeWebhookSignature(env, rawBody, signatureHeader) {
  const endpointSecret = requireEnv(env, "STRIPE_WEBHOOK_SECRET");
  const parts = String(signatureHeader || "").split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || !signatures.length) {
    throw new Error("Stripe webhook signature is missing.");
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    throw new Error("Stripe webhook signature timestamp is outside the allowed tolerance.");
  }

  const expected = await hmacHex(endpointSecret, `${timestamp}.${rawBody}`);
  if (!signatures.some((signature) => constantTimeEqual(signature, expected))) {
    throw new Error("Stripe webhook signature could not be verified.");
  }

  return JSON.parse(rawBody);
}
