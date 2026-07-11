import { checkoutProductById } from "./product-catalog.js";

/*
  Cloudflare Pages Functions checkout helper.

  Set these in Cloudflare Dashboard:
  Workers & Pages -> your Pages project -> Settings -> Variables and Secrets.

  Required production/preview variables:
  - PAYPAL_CLIENT_ID
  - PAYPAL_CLIENT_SECRET
  - RESEND_API_KEY
  - CONTACT_EMAIL

  Optional:
  - PAYPAL_ENV=sandbox or live; defaults to sandbox
  - RESEND_FROM; defaults to Resend's onboarding sender until a domain sender is configured

  Never put PAYPAL_CLIENT_SECRET or RESEND_API_KEY in frontend HTML/JS/CSS.
*/

const CURRENCY = "AUD";
const BRAND_NAME = "GLOAMWEALD";
const DEFAULT_RESEND_FROM = "Gloamweald <onboarding@resend.dev>";

const SHIPPING_RATES = Object.freeze({
  pickup: {
    label: "Brisbane pickup / hand-off",
    amount: 0,
    requiresAddress: false,
  },
  "au-standard": {
    label: "Australia standard tracked shipping",
    amount: 10,
    requiresAddress: true,
  },
  "au-express": {
    label: "Australia express tracked shipping",
    amount: 16,
    requiresAddress: true,
  },
});

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

export function paypalBaseUrl(env) {
  return env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function normaliseOrder(input) {
  const rawItems = Array.isArray(input.items) ? input.items : [];
  const quantities = new Map();

  rawItems.forEach((item) => {
    const id = safeText(item.id, 80);
    const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1));
    if (!checkoutProductById(id)) throw new Error("Cart contains an unavailable item.");
    quantities.set(id, (quantities.get(id) || 0) + quantity);
  });

  const items = [...quantities.entries()].map(([id, quantity]) => {
    const product = checkoutProductById(id);
    return {
      id,
      name: product.name,
      quantity,
      unitAmount: product.unitAmount,
      lineTotal: product.unitAmount * quantity,
    };
  });

  if (!items.length) throw new Error("Cart is empty.");

  const shippingId = safeText(input.shippingId || "au-standard", 80);
  const shipping = SHIPPING_RATES[shippingId];
  if (!shipping) throw new Error("Choose a valid shipping method.");

  const customer = {
    name: safeText(input.customer?.name, 180),
    email: safeText(input.customer?.email, 180),
    phone: safeText(input.customer?.phone, 80),
    address1: safeText(input.customer?.address1, 180),
    address2: safeText(input.customer?.address2, 180),
    city: safeText(input.customer?.city, 120),
    state: safeText(input.customer?.state, 120),
    postcode: safeText(input.customer?.postcode, 40),
    country: safeText(input.customer?.country || "AU", 10),
  };

  if (!customer.name) throw new Error("Name is required.");
  if (!customer.email || !customer.email.includes("@")) throw new Error("A valid email is required.");

  if (shipping.requiresAddress) {
    if (customer.country !== "AU") {
      throw new Error("International shipping needs a custom quote before PayPal payment.");
    }
    ["address1", "city", "state", "postcode"].forEach((field) => {
      if (!customer[field]) throw new Error("Postal address is required for shipping.");
    });
  }

  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const total = subtotal + shipping.amount;
  const random = new Uint8Array(3);
  crypto.getRandomValues(random);
  const suffix = [...random].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  const reference = `GLOAM-${Date.now().toString(36).toUpperCase()}-${suffix}`;

  return {
    reference,
    customer,
    items,
    shippingId,
    shipping,
    notes: safeText(input.notes, 1200),
    subtotal,
    total,
    currency: CURRENCY,
    createdAt: new Date().toISOString(),
  };
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
  };

  if (order.shipping.requiresAddress) {
    purchaseUnit.shipping = {
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
    };
  }

  return {
    intent: "CAPTURE",
    purchase_units: [purchaseUnit],
    payment_source: {
      paypal: {
        experience_context: {
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          payment_method_selected: "PAYPAL",
          brand_name: BRAND_NAME,
          shipping_preference: order.shipping.requiresAddress ? "SET_PROVIDED_ADDRESS" : "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      },
    },
  };
}

function orderEmailText(order, captureData = {}) {
  const purchaseUnit = captureData.purchase_units?.[0] || {};
  const capture = purchaseUnit.payments?.captures?.[0] || {};
  const payerEmail = captureData.payment_source?.paypal?.email_address || "";
  const locality = [order.customer.city, order.customer.state, order.customer.postcode]
    .filter(Boolean)
    .join(" ");

  return [
    "GLOAMWEALD PayPal order",
    "",
    `Reference: ${order.reference}`,
    `PayPal order ID: ${captureData.id || order.paypalOrderId || ""}`,
    `PayPal capture ID: ${capture.id || ""}`,
    `PayPal status: ${capture.status || captureData.status || ""}`,
    payerEmail ? `PayPal payer email: ${payerEmail}` : null,
    "",
    "Items",
    ...order.items.map(
      (item) => `${item.quantity} x ${item.name} - $${moneyValue(item.lineTotal)} ${CURRENCY}`,
    ),
    "",
    `Subtotal: $${moneyValue(order.subtotal)} ${CURRENCY}`,
    `Shipping: $${moneyValue(order.shipping.amount)} ${CURRENCY} (${order.shipping.label})`,
    `Total: $${moneyValue(order.total)} ${CURRENCY}`,
    "",
    "Customer",
    order.customer.name,
    order.customer.email,
    order.customer.phone || null,
    "",
    "Delivery / pickup details",
    order.shipping.requiresAddress ? order.customer.address1 : "Pickup / hand-off",
    order.shipping.requiresAddress ? order.customer.address2 : null,
    order.shipping.requiresAddress ? locality : null,
    order.shipping.requiresAddress ? "Australia" : null,
    "",
    "Customer notes",
    order.notes || "None",
  ]
    .filter((line) => line !== null && String(line).trim() !== "")
    .join("\n");
}

export async function sendOrderEmail(env, order, captureData) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv(env, "RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || DEFAULT_RESEND_FROM,
      to: [requireEnv(env, "CONTACT_EMAIL")],
      reply_to: order.customer.email,
      subject: `GLOAMWEALD PayPal order ${order.reference}`,
      text: orderEmailText(order, captureData),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Order email could not be sent.");
  }
  return data;
}
