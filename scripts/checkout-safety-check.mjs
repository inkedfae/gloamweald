import fs from "node:fs";
import path from "node:path";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = (value) => Buffer.from(value, "binary").toString("base64");
if (!globalThis.atob) globalThis.atob = (value) => Buffer.from(value, "base64").toString("binary");

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readIfExists = (file) => {
  const fullPath = path.join(root, file);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
};
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
    "stripe-checkout.js",
    "shop.html",
    "src/product-catalog.js",
    "style.css",
    "success.html",
  ]
    .map((file) => `--- ${file} ---\n${read(file)}`)
    .join("\n");
}

const script = read("script.js");
const stripeFrontend = readIfExists("stripe-checkout.js");
const checkoutFrontend = `${script}\n${stripeFrontend}`;
const frontend = frontendText();
const { onRequestGet: checkoutConfig } = await import("../functions/api/checkout-config.js");
const {
  normaliseOrder,
  signOrder,
  stripeCheckoutSessionForm,
  verifyOrderToken,
  verifyStripeWebhookSignature,
} = await import("../src/checkout-shared.js");
const {
  GLOAMWEALD_PRODUCTS,
  checkoutProductById,
  productDisplayPrice,
  productPriceAmount,
} = await import("../src/product-catalog.js");
await import("../functions/api/create-paypal-order.js");
await import("../functions/api/capture-paypal-order.js");
await import("../functions/api/create-stripe-session.js");
await import("../functions/api/confirm-stripe-session.js");
await import("../functions/api/stripe-webhook.js");

const checkoutShared = read("src/checkout-shared.js");
const productsStub = read("products.js");
const stripeConfirm = read("functions/api/confirm-stripe-session.js");
const stripeWebhook = read("functions/api/stripe-webhook.js");

const configuredResponse = await checkoutConfig({
  env: {
    PAYPAL_CLIENT_ID: "public-client-id",
    PAYPAL_CLIENT_SECRET: "server-secret-placeholder",
    STRIPE_SECRET_KEY: "stripe-secret-placeholder",
    STRIPE_WEBHOOK_SECRET: "stripe-webhook-secret-placeholder",
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
    configuredBody.stripeConfigured === true &&
    !("PAYPAL_CLIENT_SECRET" in configuredBody) &&
    !("STRIPE_SECRET_KEY" in configuredBody) &&
    !("STRIPE_WEBHOOK_SECRET" in configuredBody) &&
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
  !/PAYPAL_CLIENT_SECRET|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|RESEND_API_KEY/.test(frontend),
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
  [
    "/api/checkout-config",
    "/api/create-paypal-order",
    "/api/capture-paypal-order",
    "/api/create-stripe-session",
    "/api/confirm-stripe-session",
  ].every((route) => checkoutFrontend.includes(route)) &&
    !checkoutFrontend.includes("/v2/checkout/orders") &&
    !checkoutFrontend.includes("api.stripe.com"),
  "Frontend uses local checkout API routes and does not call PayPal or Stripe APIs directly.",
);

const pricedProducts = GLOAMWEALD_PRODUCTS.filter((product) => productPriceAmount(product) !== null);
const checkoutProducts = pricedProducts
  .map((product) => ({
    product,
    checkoutProduct: checkoutProductById(product.id),
  }))
  .filter(({ product }) => product.orderable);
const checkoutPricesMatchCatalog = checkoutProducts.every(
  ({ product, checkoutProduct }) =>
    checkoutProduct &&
    checkoutProduct.name === product.name &&
    checkoutProduct.unitAmount === productPriceAmount(product),
);
check(
  "backend checkout prices come from product catalogue",
  checkoutShared.includes('from "./product-catalog.js"') &&
    !checkoutShared.includes("ORDERABLE_PRODUCTS") &&
    checkoutPricesMatchCatalog,
  "src/checkout-shared.js imports product-catalog and derives checkout unit amounts from catalogue prices.",
);

const duplicatePriceMapFound = /unitAmount:\s*(45|75|85|90)|"dark-elf-bracelet"\s*:\s*\{|"bonelink-wallet-chain"\s*:\s*\{|"half-persian-wallet-chain-pendant"\s*:\s*\{/.test(checkoutShared);
const productsLoaderDuplicatesCatalogueData = /dark-elf-bracelet|bonelink-wallet-chain|half-persian-wallet-chain-pendant|amount:\s*(45|75|85|90)|\$(45|75|85|90)/.test(productsStub);
check(
  "only one editable source for product prices",
  fs.existsSync(path.join(root, "src/product-catalog.js")) &&
    !duplicatePriceMapFound &&
    productsStub.includes("src/product-catalog.js") &&
    !productsLoaderDuplicatesCatalogueData,
  "Product display metadata and checkout prices live in src/product-catalog.js; products.js only loads that catalogue for existing pages.",
);

const displayedPricesMatchCheckout = checkoutProducts.every(({ product, checkoutProduct }) =>
  productDisplayPrice(product).includes(String(checkoutProduct.unitAmount)),
);
check(
  "shop display prices match backend checkout prices",
  displayedPricesMatchCheckout,
  "Every purchasable product display price is formatted from the same catalogue amount used by checkout.",
);

const blockedProducts = GLOAMWEALD_PRODUCTS.filter(
  (product) => !product.orderable || productPriceAmount(product) === null,
);
const blockedProductsStayBlocked = blockedProducts.every((product) => checkoutProductById(product.id) === null);
check(
  "placeholder and concept products are blocked from checkout",
  blockedProductsStayBlocked,
  `${blockedProducts.length} non-purchasable/enquiry products are not available to backend checkout.`,
);

const env = {
  PAYPAL_CLIENT_ID: "public-client-id",
  PAYPAL_CLIENT_SECRET: "server-secret-placeholder",
  STRIPE_SECRET_KEY: "stripe-secret-placeholder",
  STRIPE_WEBHOOK_SECRET: "stripe-webhook-secret-placeholder",
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
const darkElfCheckoutProduct = checkoutProductById("dark-elf-bracelet");
check(
  "existing create/capture token flow still works",
  pickupOrder.total === darkElfCheckoutProduct.unitAmount && verified.paypalOrderId === "PAYPAL-ORDER-123",
  "Shared checkout helper still normalises orders and verifies server-signed capture tokens.",
);

const stripeForm = stripeCheckoutSessionForm(pickupOrder, {
  successUrl: "https://example.com/success.html?provider=stripe&session_id={CHECKOUT_SESSION_ID}",
  cancelUrl: "https://example.com/cart.html?checkout=stripe-cancelled",
});
check(
  "Stripe Checkout Session uses backend order values",
  stripeForm.get("mode") === "payment" &&
    stripeForm.get("line_items[0][price_data][unit_amount]") === String(pickupOrder.items[0].unitAmount * 100) &&
    stripeForm.get("line_items[0][price_data][currency]") === "aud" &&
    stripeForm.get("metadata[reference]") === pickupOrder.reference &&
    !stripeForm.toString().includes("stripe-secret-placeholder"),
  "Stripe line items are generated server-side from the same normalised order totals and no secret is placed in the form.",
);

const webhookBody = JSON.stringify({
  id: "evt_test",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      payment_status: "paid",
      metadata: { reference: pickupOrder.reference },
    },
  },
});
const webhookTimestamp = Math.floor(Date.now() / 1000);
const signatureBytes = await crypto.subtle.sign(
  "HMAC",
  await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  ),
  new TextEncoder().encode(`${webhookTimestamp}.${webhookBody}`),
);
const webhookSignature = [...new Uint8Array(signatureBytes)]
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");
const verifiedWebhook = await verifyStripeWebhookSignature(
  env,
  webhookBody,
  `t=${webhookTimestamp},v1=${webhookSignature}`,
);
check(
  "Stripe webhook signature verification works",
  verifiedWebhook.id === "evt_test",
  "Webhook events are verified with STRIPE_WEBHOOK_SECRET before being trusted.",
);

check(
  "Stripe success waits for backend confirmation",
  checkoutFrontend.includes("confirmStripeSuccess") &&
    checkoutFrontend.includes("/api/confirm-stripe-session") &&
    checkoutFrontend.includes("if (!response.ok || !data.paid)") &&
    checkoutFrontend.includes("clearCart();"),
  "The Stripe success page calls the backend confirmation route before clearing the cart.",
);

check(
  "Stripe order email is sent only by webhook with duplicate guard",
  !stripeConfirm.includes("sendStripeOrderEmail") &&
    stripeWebhook.includes("sendStripeOrderEmailOnce") &&
    checkoutShared.includes("stripeOrderEmailAlreadySent") &&
    checkoutShared.includes("gloamweald_order_email_sent") &&
    checkoutShared.includes("updateStripeCheckoutSessionMetadata"),
  "The success confirmation endpoint does not send emails; webhook sends via an idempotent metadata-guarded helper.",
);

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} | ${result.name} | ${result.detail}`);
}

const failures = results.filter((result) => !result.passed);
if (failures.length) process.exit(1);
