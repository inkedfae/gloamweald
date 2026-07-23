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

function expectThrows(name, fn, pattern, detail) {
  try {
    fn();
    check(name, false, detail);
  } catch (error) {
    check(name, pattern.test(error.message), `${detail} (${error.message})`);
  }
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
    "checkout.js",
    "checkout.css",
    "shop.html",
    "src/product-catalog.js",
    "style.css",
    "success.html",
  ]
    .map((file) => `--- ${file} ---\n${read(file)}`)
    .join("\n");
}

const script = read("script.js");
const checkoutScript = read("checkout.js");
const checkoutFrontend = `${script}\n${checkoutScript}`;
const frontend = frontendText();
const checkoutShared = read("src/checkout-shared.js");
const checkoutOrder = read("src/checkout-order.js");
const customerEmails = read("src/customer-order-emails.js");
const productsStub = read("products.js");
const createPayPalOrder = read("functions/api/create-paypal-order.js");
const paypalCapture = read("functions/api/capture-paypal-order.js");
const createStripeSession = read("functions/api/create-stripe-session.js");
const stripeConfirm = read("functions/api/confirm-stripe-session.js");
const stripeWebhook = read("functions/api/stripe-webhook.js");
const successPage = read("success.html");
const cartPage = read("cart.html");
const carePage = read("care.html");
const removedStripeCheckout = !fs.existsSync(path.join(root, "stripe-checkout.js"));

const { onRequestGet: checkoutConfig } = await import("../functions/api/checkout-config.js");
const {
  paypalOrderPayload,
  signOrder,
  stripeCheckoutSessionForm,
  verifyOrderToken,
  verifyStripeWebhookSignature,
} = await import("../src/checkout-shared.js");
const {
  checkoutShippingAmount,
  normaliseOrder,
} = await import("../src/checkout-order.js");
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

const env = {
  PAYPAL_CLIENT_ID: "public-client-id",
  PAYPAL_CLIENT_SECRET: "server-secret-placeholder",
  STRIPE_SECRET_KEY: "stripe-secret-placeholder",
  STRIPE_WEBHOOK_SECRET: "stripe-webhook-secret-placeholder",
  RESEND_API_KEY: "resend-secret-placeholder",
  CONTACT_EMAIL: "orders@example.com",
  PAYPAL_ENV: "sandbox",
};

const configuredResponse = await checkoutConfig({ env });
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
  "GET /api/checkout-config exposes only the public PayPal client id, currency, env, and Stripe configured flag.",
);

const missingResponse = await checkoutConfig({ env: {} });
const missingBody = await missingResponse.json();
check(
  "checkout-config disables checkout when public config is missing",
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
  !checkoutFrontend.includes("REPLACE_WITH_PAYPAL_CLIENT_ID"),
  "Frontend scripts no longer contain REPLACE_WITH_PAYPAL_CLIENT_ID.",
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

check(
  "no dead checkout override script remains",
  removedStripeCheckout &&
    !cartPage.includes("stripe-checkout.js") &&
    !successPage.includes("stripe-checkout.js") &&
    cartPage.includes("checkout.js") &&
    successPage.includes("checkout.js") &&
    !fs.existsSync(path.join(root, "cart-shipping.js")) &&
    !cartPage.includes("cart-shipping.js"),
  "Checkout is handled by checkout.js as the direct checkout module; no permanent override/duplicate checkout script remains.",
);

check(
  "old pickup labels and old rates are gone from checkout code",
  !/Brisbane pickup|hand-off|handoff|Placeholder rate|\$10 AUD|\$16 AUD|Australia standard tracked shipping|Australia express tracked shipping|amount:\s*10,|amount:\s*16,/.test(
    `${checkoutFrontend}\n${checkoutShared}\n${checkoutOrder}`,
  ),
  "Old standard-pickup wording and the old $10/$16 shipping values are not present in checkout code.",
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
  checkoutOrder.includes('from "./product-catalog.js"') &&
    createPayPalOrder.includes('from "../../src/checkout-order.js"') &&
    createStripeSession.includes('from "../../src/checkout-order.js"') &&
    !checkoutOrder.includes("ORDERABLE_PRODUCTS") &&
    checkoutPricesMatchCatalog,
  "src/checkout-order.js imports product-catalog and both payment creation endpoints use its normaliseOrder().",
);

const duplicatePriceMapFound = /unitAmount:\s*(45|75|85|90)|"dark-elf-bracelet"\s*:\s*\{|"bonelink-wallet-chain"\s*:\s*\{|"half-persian-wallet-chain-pendant"\s*:\s*\{/.test(
  `${checkoutShared}\n${checkoutOrder}`,
);
const productsLoaderDuplicatesCatalogueData = /dark-elf-bracelet|bonelink-wallet-chain|half-persian-wallet-chain-pendant|amount:\s*(45|75|85|90)|\$(45|75|85|90)/.test(productsStub);
check(
  "only one editable source for product prices",
  fs.existsSync(path.join(root, "src/product-catalog.js")) &&
    !duplicatePriceMapFound &&
    productsStub.includes("src/product-catalog.js") &&
    !productsLoaderDuplicatesCatalogueData,
  "Product display metadata and checkout prices live in src/product-catalog.js; checkout code reads catalogue prices.",
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
  "concept/enquiry products are blocked from backend checkout unless explicitly orderable with a price",
  blockedProductsStayBlocked,
  `${blockedProducts.length} non-purchasable/enquiry products are not available to backend checkout.`,
);

const customer = {
  name: "Test Customer",
  email: "test@example.com",
  phone: "0400000000",
  address1: "1 Gloam Way",
  city: "Brisbane",
  state: "QLD",
  postcode: "4000",
  country: "AU",
};

const darkElfCartItem = {
  id: "dark-elf-bracelet",
  quantity: 1,
  selections: {
    length: { value: 18 },
    clasp: { id: "pictured" },
    extender: { selected: false },
  },
};
const bonelinkCartItem = {
  id: "bonelink-wallet-chain",
  quantity: 1,
  selections: {},
};

const underStandard = normaliseOrder({
  items: [darkElfCartItem],
  shippingId: "au-standard",
  customer,
  notes: "Dark Elf Bracelet +1.5 cm",
});
const underExpress = normaliseOrder({
  items: [darkElfCartItem],
  shippingId: "au-express",
  customer,
});
const overStandard = normaliseOrder({
  items: [darkElfCartItem, bonelinkCartItem],
  shippingId: "au-standard",
  customer,
});
const overExpress = normaliseOrder({
  items: [darkElfCartItem, bonelinkCartItem],
  shippingId: "au-express",
  customer,
});

check(
  "backend AU shipping rates are exact decimals",
  checkoutShippingAmount("au-standard", 75) === 10.95 &&
    checkoutShippingAmount("au-express", 75) === 13.95 &&
    checkoutShippingAmount("au-standard", 150) === 0 &&
    checkoutShippingAmount("au-express", 150) === 3 &&
    underStandard.shipping.amount === 10.95 &&
    underExpress.shipping.amount === 13.95 &&
    overStandard.shipping.amount === 0 &&
    overExpress.shipping.amount === 3,
  "Backend shipping source returns $10.95, $13.95, $0.00, and $3.00 for the required AU cases.",
);

expectThrows(
  "backend rejects stale pickup shipping",
  () =>
    normaliseOrder({
      items: [darkElfCartItem],
      shippingId: "pickup",
      customer,
    }),
  /pickup|Australia Post/i,
  "A stale localStorage/form value of pickup cannot pass backend order normalisation.",
);

expectThrows(
  "backend requires Australian postal address",
  () =>
    normaliseOrder({
      items: [darkElfCartItem],
      shippingId: "au-standard",
      customer: { name: "Test Customer", email: "test@example.com", country: "AU" },
    }),
  /Postal address is required/i,
  "AU shipping cannot create a PayPal order or Stripe session without postal address fields.",
);

expectThrows(
  "backend blocks international quote-only checkout",
  () =>
    normaliseOrder({
      items: [darkElfCartItem],
      shippingId: "international-quote",
      customer: { ...customer, country: "INTL" },
    }),
  /custom quote/i,
  "International quote-only checkout is blocked before payment creation.",
);

const token = await signOrder(env, { ...underStandard, paypalOrderId: "PAYPAL-ORDER-123" });
const verified = await verifyOrderToken(env, token);
check(
  "existing PayPal create/capture token flow still works",
  verified.paypalOrderId === "PAYPAL-ORDER-123" && verified.shipping.amount === 10.95,
  "Checkout helper still signs and verifies server-side PayPal capture tokens with backend-calculated shipping.",
);

const paypalPayloadUnder = paypalOrderPayload(underStandard);
const paypalPayloadExpress = paypalOrderPayload(overExpress);
check(
  "PayPal payload uses backend decimal shipping values",
  paypalPayloadUnder.purchase_units[0].amount.breakdown.shipping.value === "10.95" &&
    paypalPayloadUnder.purchase_units[0].amount.value === "100.95" &&
    paypalPayloadExpress.purchase_units[0].amount.breakdown.shipping.value === "3.00" &&
    paypalPayloadExpress.purchase_units[0].amount.value === "188.00" &&
    paypalPayloadUnder.payment_source.paypal.experience_context.shipping_preference === "SET_PROVIDED_ADDRESS",
  "PayPal order creation receives backend totals and two-decimal shipping amounts.",
);

const stripeFormUnder = stripeCheckoutSessionForm(underStandard, {
  successUrl: "https://example.com/success.html?provider=stripe&session_id={CHECKOUT_SESSION_ID}",
  cancelUrl: "https://example.com/cart.html?checkout=stripe-cancelled",
});
const stripeFormStandardFree = stripeCheckoutSessionForm(overStandard, {
  successUrl: "https://example.com/success.html?provider=stripe&session_id={CHECKOUT_SESSION_ID}",
  cancelUrl: "https://example.com/cart.html?checkout=stripe-cancelled",
});
const stripeFormExpressUpgrade = stripeCheckoutSessionForm(overExpress, {
  successUrl: "https://example.com/success.html?provider=stripe&session_id={CHECKOUT_SESSION_ID}",
  cancelUrl: "https://example.com/cart.html?checkout=stripe-cancelled",
});
check(
  "Stripe Checkout Session uses backend decimal shipping cents",
  stripeFormUnder.get("line_items[1][price_data][unit_amount]") === "1095" &&
    !stripeFormStandardFree.has("line_items[2][price_data][unit_amount]") &&
    stripeFormExpressUpgrade.get("line_items[2][price_data][unit_amount]") === "300" &&
    stripeFormUnder.get("customer_email") === underStandard.customer.email &&
    stripeFormUnder.get("metadata[shipping_amount]") === "10.95" &&
    stripeFormExpressUpgrade.get("metadata[shipping_amount]") === "3.00" &&
    !stripeFormUnder.toString().includes("stripe-secret-placeholder"),
  "Stripe line items are generated server-side and convert $10.95/$3.00 shipping to 1095/300 cents.",
);

const webhookBody = JSON.stringify({
  id: "evt_test",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      payment_status: "paid",
      metadata: { reference: underStandard.reference },
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
  "PayPal capture sends merchant and customer emails after confirmed capture",
  paypalCapture.includes("const captureData = await response.json") &&
    paypalCapture.includes("if (!response.ok)") &&
    paypalCapture.indexOf("const emailResult = await sendPayPalOrderEmails") > paypalCapture.indexOf("if (!response.ok)") &&
    customerEmails.includes("export async function sendPayPalOrderEmails") &&
    customerEmails.includes("sendPayPalMerchantOrderEmail(env, order, captureData)") &&
    customerEmails.includes("sendPayPalCustomerOrderEmail(env, order, captureData)") &&
    customerEmails.includes('subject: "Your Gloamweald order is confirmed"'),
  "PayPal customer confirmation is sent only after backend capture succeeds, while the merchant notification remains in place.",
);

check(
  "customer confirmation emails include required content and HTML/text",
  customerEmails.includes("function customerEmailText") &&
    customerEmails.includes("function customerEmailHtml") &&
    customerEmails.includes("html: email.html") &&
    customerEmails.includes("Your offering has been received, and your payment is confirmed.") &&
    customerEmails.includes("Joining you will be:") &&
    customerEmails.includes("Shipping cost:") &&
    customerEmails.includes("https://gloamweald.com/care.html") &&
    customerEmails.includes("replyTo: requireEnv(env, \"CONTACT_EMAIL\")"),
  "Customer emails have text and simple HTML versions, required wording, shipping cost/address, care link, and CONTACT_EMAIL reply-to.",
);

check(
  "merchant emails include shipping address and notes",
  customerEmails.includes("paypalMerchantEmailText") &&
    customerEmails.includes("stripeMerchantEmailText") &&
    customerEmails.includes("Delivery details") &&
    customerEmails.includes("Customer notes / length adjustment requests") &&
    customerEmails.includes("shipping.label") &&
    customerEmails.includes("shipping_amount"),
  "Merchant notifications keep payment refs and show shipping method/cost/address and order notes.",
);

check(
  "Stripe success waits for backend confirmation",
  checkoutScript.includes("confirmStripeStatus") &&
    checkoutScript.includes("/api/confirm-stripe-session") &&
    checkoutScript.includes("if (!stripe.ok || !stripe.paid)") &&
    checkoutScript.includes("Awaiting payment confirmation") &&
    checkoutScript.includes("Confirmation warning") &&
    checkoutScript.includes("Your cart has not been cleared") &&
    checkoutScript.includes("clearCart();"),
  "The Stripe success page calls the backend confirmation route, shows distinct confirmed/awaiting/error states, and only clears the cart after confirmed payment.",
);

check(
  "Stripe order emails are sent only by webhook with duplicate guards",
  !stripeConfirm.includes("sendStripeOrderEmail") &&
    stripeWebhook.includes("sendStripeOrderEmailsOnce") &&
    customerEmails.includes("stripeMerchantEmailAlreadySent") &&
    customerEmails.includes("stripeCustomerEmailAlreadySent") &&
    customerEmails.includes("gloamweald_order_email_sent") &&
    customerEmails.includes("gloamweald_customer_email_sent") &&
    customerEmails.includes("updateStripeCheckoutSessionMetadata"),
  "The success confirmation endpoint does not send emails; webhook sends merchant and customer emails via metadata-guarded helpers.",
);

check(
  "success page does not send emails",
  !successPage.includes("sendOrderEmail") &&
    !successPage.includes("sendCustomerOrderEmail") &&
    !successPage.includes("sendResendEmail") &&
    !checkoutFrontend.includes("sendResendEmail"),
  "Frontend success handling only confirms payment/cart state; it does not send merchant or customer emails.",
);

check(
  "checkout shipping and care copy are updated",
  cartPage.includes("All Gloamweald orders are sent through Australia Post with tracking.") &&
    cartPage.includes("Standard tracked shipping within Australia") &&
    !cartPage.includes("Small length adjustments") &&
    carePage.includes("Quality and care concerns") &&
    carePage.includes("case by case"),
  "Checkout page contains customer shipping guidance without the old length-adjustment box, and care page contains quality/care concerns.",
);

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} | ${result.name} | ${result.detail}`);
}

const failures = results.filter((result) => !result.passed);
if (failures.length) process.exit(1);
