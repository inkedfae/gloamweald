import fs from "node:fs";
import path from "node:path";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = (value) => Buffer.from(value, "binary").toString("base64");
if (!globalThis.atob) globalThis.atob = (value) => Buffer.from(value, "base64").toString("binary");

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const results = [];

function check(name, condition, detail) {
  results.push({ name, passed: Boolean(condition), detail });
}

function frontendText() {
  return [
    "about.html",
    "care.html",
    "cart.html",
    "collection-classics.html",
    "collection-morrigan.html",
    "collection-tenebris.html",
    "collection-wyrms-hoard.html",
    "collections.html",
    "contact.html",
    "index.html",
    "products.js",
    "script.js",
    "shop.html",
    "style.css",
    "success.html",
  ]
    .map((file) => `--- ${file} ---\n${read(file)}`)
    .join("\n");
}

const script = read("script.js");
const frontend = frontendText();
const { onRequestGet: checkoutConfig } = await import("../functions/api/checkout-config.js");
const {
  normaliseOrder,
  signOrder,
  verifyOrderToken,
} = await import("../src/checkout-shared.js");
await import("../functions/api/create-paypal-order.js");
await import("../functions/api/capture-paypal-order.js");

const configuredResponse = await checkoutConfig({
  env: {
    PAYPAL_CLIENT_ID: "public-client-id",
    PAYPAL_CLIENT_SECRET: "server-secret-placeholder",
    RESEND_API_KEY: "resend-secret-placeholder",
    CONTACT_EMAIL: "orders@example.com",
    PAYPAL_ENV: "sandbox",
  },
});
const configuredBody = await configuredResponse.json();
check(
  "checkout-config returns only safe public keys",
  configuredBody.configured === true &&
    configuredBody.paypalClientId === "public-client-id" &&
    configuredBody.currency === "AUD" &&
    configuredBody.paypalEnv === "sandbox" &&
    !("PAYPAL_CLIENT_SECRET" in configuredBody) &&
    !("RESEND_API_KEY" in configuredBody) &&
    !("CONTACT_EMAIL" in configuredBody),
  "GET /api/checkout-config does not expose server-only env values.",
);

const missingResponse = await checkoutConfig({ env: {} });
const missingBody = await missingResponse.json();
check(
  "checkout-config disables PayPal when public client id is missing",
  missingBody.configured === false && !missingBody.paypalClientId && typeof missingBody.error === "string",
  "Missing PAYPAL_CLIENT_ID returns configured:false with a non-secret message.",
);

check(
  "frontend contains no server-only env names",
  !/PAYPAL_CLIENT_SECRET|RESEND_API_KEY/.test(frontend),
  "Frontend HTML/CSS/JS does not mention server-only env keys.",
);

check(
  "script.js has no hardcoded PayPal placeholder",
  !script.includes("REPLACE_WITH_PAYPAL_CLIENT_ID"),
  "script.js no longer contains REPLACE_WITH_PAYPAL_CLIENT_ID.",
);

check(
  "script.js fetches public config before enabling PayPal",
  script.includes('const PAYPAL_CONFIG_ENDPOINT = "/api/checkout-config"') &&
    script.includes("await loadCheckoutConfig();") &&
    script.includes("renderPayPalButtons();") &&
    script.includes("checkoutConfig.paypalClientId"),
  "PayPal startup waits for /api/checkout-config and uses the returned client id.",
);

check(
  "PayPal SDK load is gated by valid config",
  script.includes("if (!paypalReady())") &&
    script.includes("PayPal checkout is not configured.") &&
    script.includes('"client-id": checkoutConfig.paypalClientId'),
  "SDK URL is built only after paypalReady() and uses checkoutConfig.paypalClientId.",
);

check(
  "frontend calls only expected checkout APIs",
  ["/api/checkout-config", "/api/create-paypal-order", "/api/capture-paypal-order"].every((route) =>
    script.includes(route),
  ) && !script.includes("/v2/checkout/orders"),
  "Frontend uses the three local API routes and does not call PayPal Orders API directly.",
);

const env = {
  PAYPAL_CLIENT_ID: "public-client-id",
  PAYPAL_CLIENT_SECRET: "server-secret-placeholder",
  RESEND_API_KEY: "resend-secret-placeholder",
  CONTACT_EMAIL: "orders@example.com",
};
const pickupOrder = normaliseOrder({
  items: [{ id: "dark-elf-bracelet", quantity: 1 }],
  shippingId: "pickup",
  customer: { name: "Test Customer", email: "test@example.com", country: "AU" },
});
const token = await signOrder(env, { ...pickupOrder, paypalOrderId: "PAYPAL-ORDER-123" });
const verified = await verifyOrderToken(env, token);
check(
  "existing create/capture token flow still works",
  pickupOrder.total === 45 && verified.paypalOrderId === "PAYPAL-ORDER-123",
  "Shared checkout helper still normalises orders and verifies server-signed capture tokens.",
);

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} | ${result.name} | ${result.detail}`);
}

const failures = results.filter((result) => !result.passed);
if (failures.length) process.exit(1);
