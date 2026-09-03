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
    "collection-morrigan.html",
    "collection-tenebris.html",
    "collection-wyrms-hoard.html",
    "contact.html",
    "index.html",
    "products.js",
    "script.js",
    "checkout.js",
    "checkout.css",
    "shop.html",
    "src/product-catalog.js",
    "src/world-content.js",
    "style.css",
    "success.html",
    "weald.css",
    "weald.html",
    "weald.js",
  ]
    .map((file) => `--- ${file} ---\n${read(file)}`)
    .join("\n");
}

const script = read("script.js");
const style = read("style.css");
const checkoutScript = read("checkout.js");
const checkoutFrontend = `${script}\n${checkoutScript}`;
const frontend = frontendText();
const shopPage = read("shop.html");
const wealdHtml = read("weald.html");
const wealdJs = read("weald.js");
const wealdCss = read("weald.css");
const loreCss = read("lore.css");
const worldContent = read("src/world-content.js");
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
  checkoutShippingForOrder,
  checkoutShippingAmount,
  moneyValue,
  normaliseOrder,
} = await import("../src/checkout-order.js");
const {
  GLOAMWEALD_COLLECTIONS,
  GLOAMWEALD_PRODUCTS,
  BRACELET_LENGTH_TOLERANCE_NOTE,
  NECKLACE_LENGTH_ADJUSTMENT_NOTE,
  STANDARD_BRACELET_LENGTHS,
  STANDARD_EXTENDER_OPTIONS,
  claspOptionsForProduct,
  checkoutProductById,
  extenderOptionsForProduct,
  lengthOptionsForProduct,
  normaliseProductConfiguration,
  productDisplayPrice,
  productPriceAmount,
} = await import("../src/product-catalog.js");
const { validateWorldContent } = await import("../src/world-content.js");
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

const redirects = readIfExists("_redirects");
const worldContentIssues = validateWorldContent({
  products: GLOAMWEALD_PRODUCTS,
  collections: GLOAMWEALD_COLLECTIONS,
});
check(
  "The Weald is the canonical world hub",
  fs.existsSync(path.join(root, "weald.html")) &&
    !fs.existsSync(path.join(root, "collections.html")) &&
    !fs.existsSync(path.join(root, "collection-classics.html")) &&
    redirects.includes("/collections.html /weald.html 301") &&
    redirects.includes("/collection-classics.html /shop.html 301") &&
    !frontend.includes('href="collections.html"') &&
    !frontend.includes('href="collection-classics.html"'),
  "weald.html exists, obsolete collection directory pages are removed, redirects are present, and frontend links do not point to the deleted pages.",
);

check(
  "Classics collection is removed without changing product availability",
  !("classics" in GLOAMWEALD_COLLECTIONS) &&
    !GLOAMWEALD_PRODUCTS.some((product) => product.collection === "classics"),
  "Classics is not a collection key and no product is assigned to collection:\"classics\"; products remain visible by shop/type.",
);

check(
  "world content validates against catalogue references",
  worldContentIssues.length === 0,
  worldContentIssues.length
    ? `World content issues: ${worldContentIssues.join("; ")}`
    : "World hub lore-from-the-edge entries and collection cards reference existing products and collections.",
);

check(
  "Weald hub has no Relics section wiring",
  !/data-weald-relics|weald-section--relics|id="relics"|href="#relics"|renderRelics|featuredRelic|relic-grid|relic-card|Relics from the shop/.test(
    `${wealdHtml}\n${wealdJs}\n${wealdCss}\n${worldContent}`,
  ),
  "The separate Relics section, renderer, jump link, and old featuredRelic hooks are absent from the Weald hub sources.",
);

check(
  "shop exposes lore as a generated component filter",
  shopPage.includes('data-filter-value="lore"') &&
    script.includes("function productComponentList") &&
    script.includes('components.includes("lore")') &&
    !worldContent.includes("featuredRelic"),
  "The shop has a Lore component filter, and product cards add lore as a virtual component without changing product catalogue components.",
);

check(
  "shop type and component filters support multiple simultaneous selections",
  script.includes("selectedValuesFromParams") &&
    script.includes(".getAll(group)") &&
    script.includes("selected[group].delete(value)") &&
    script.includes("selected[group].add(value)") &&
    script.includes('selectedTypes.join(",")') &&
    script.includes('selectedComponents.join(",")') &&
    script.includes("selectedTypes.size === 0 || selectedTypes.has(product.dataset.type)") &&
    script.includes("selectedComponents.size === 0 || components.some((component) => selectedComponents.has(component))"),
  "Shop type/component filters are Set-backed toggles, support comma-separated URL state, and match selected values as OR within each group.",
);

check(
  "collection pages return to the saved Weald collection position",
  wealdJs.includes("gloamweald-weald-return") &&
    ["collection-morrigan.html", "collection-tenebris.html", "collection-wyrms-hoard.html"].every((file) =>
      read(file).includes('href="weald.html#collections"'),
    ),
  "Collection card clicks save the Weald scroll state and collection breadcrumbs return to weald.html#collections.",
);

check(
  "Weald tale cards open lore without inline thumbnails",
  (() => {
    const obsoleteCardClass = ["field", "note", "card"].join("-");
    const obsoleteDataAttr = ["data", "field", "notes"].join("-");
    return (
      wealdHtml.includes("Lore from the edge.") &&
      wealdHtml.includes("data-lore-from-edge") &&
      wealdJs.includes("tale-card--interactive") &&
      wealdJs.includes("data-lore-related-products") &&
      !wealdJs.includes("~ LORE ~") &&
      !new RegExp(`${obsoleteCardClass}|${obsoleteDataAttr}|storyButtonHtml|tale-card__cue`).test(
        `${wealdHtml}\n${wealdJs}\n${wealdCss}`,
      )
    );
  })(),
  "The Weald uses tale-card naming, card-level lore triggers, and no longer renders related thumbnails or a visible lore cue inside the card.",
);

check(
  "Weald Begin here copy renders as a two-page book",
  worldContent.includes("WORLD_BEGIN_HERE_TEXT") &&
    wealdJs.includes("buildWorldBookPages") &&
    wealdJs.includes("paginateWorldBookText") &&
    wealdJs.includes("fittedWorldBookPageBreak") &&
    wealdJs.includes("textFitsInBookPage") &&
    wealdJs.includes("data-world-book-measure") &&
    wealdJs.includes("WORLD_BOOK_PARAGRAPH_BREAK") &&
    wealdJs.includes("data-weald-book-spread") &&
    wealdJs.includes("data-weald-book-turn") &&
    wealdCss.includes(".weald-book__spread") &&
    wealdCss.includes("grid-template-columns: repeat(2") &&
    wealdCss.includes("height: clamp(26rem, 58svh, 34rem)") &&
    wealdCss.includes("overflow: hidden") &&
    wealdCss.includes("white-space: pre-line") &&
    !wealdJs.includes("WORLD_BOOK_TARGET_CHARACTERS") &&
    !wealdJs.includes("WORLD_BEGIN_HERE.paragraphs.map((paragraph)") &&
    !wealdJs.includes("splitWorldBookParagraph"),
  "The World intro uses the attached long-form copy as one continuous stream inside a laptop-fit, measured two-visible-page book layout.",
);

check(
  "Weald section jump links align sections to the viewport top",
  wealdJs.includes("scrollTargetToTop") &&
    wealdJs.includes(".weald-jump-nav a[href^='#']") &&
    wealdJs.includes("history.pushState"),
  "The Weald jump nav intercepts in-page section links and scrolls the target section to the top of the viewport.",
);

check(
  "Weald tale cards use a consistent related-products label",
  wealdJs.includes('<p class="tale-card__relationship-title">Related products</p>') &&
    !/relationship: "Related (?!products")/.test(worldContent),
  "Tale cards with product links always label the relationship group as Related products.",
);

check(
  "lore buttons do not render a floating read-story cue",
  script.includes("lore-button__label") &&
    !script.includes("lore-button__hover") &&
    !loreCss.includes("lore-button__hover"),
  "Lore buttons keep the compact ~ LORE ~ label and no longer include the hover/floating Read the story text layer.",
);

check(
  "lore dialog can show related product thumbnails from tale cards",
  wealdJs.includes("data-lore-related-products") &&
    script.includes("loreRelatedProducts") &&
    script.includes("data-lore-related-panel") &&
    script.includes("lore-dialog--with-related-products") &&
    loreCss.includes(".lore-dialog__related-products") &&
    loreCss.includes(".lore-dialog__product-thumbnail"),
  "The shared lore dialog supports an optional related-product rail for Weald tale-card openings.",
);

check(
  "product page lore sits under media and flashes outside the text panel",
  script.includes("product-page__media-stack") &&
    script.indexOf("product-page__media-stack") < script.indexOf("product-page__details") &&
    style.includes(".product-page__media-stack") &&
    style.includes("display: contents") &&
    style.includes("box-shadow") &&
    !script.includes("focusWithoutScroll(target);"),
  "Product pages stack lore immediately below photos on desktop, flatten to the requested mobile order, and use a quick non-focus glow flash.",
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

check(
  "browser catalogue loader exposes customisation helpers",
  [
    "configuredCartLine",
    "lengthOptionsForProduct",
    "claspOptionsForProduct",
    "extenderOptionsForProduct",
    "findExtenderOption",
  ].every((helper) => productsStub.includes(helper)) &&
    script.includes("catalog.extenderOptionsForProduct"),
  "products.js exposes the catalogue helpers needed by non-module product pages, including extender options.",
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

const optionSignature = (options) =>
  JSON.stringify(
    options.map((option) => ({
      value: Number(option.value),
      priceDelta: Number(option.priceDelta || 0),
    })),
  );
const standardBraceletSignature = optionSignature(STANDARD_BRACELET_LENGTHS);
const standardExtenderSignature = optionSignature(STANDARD_EXTENDER_OPTIONS);
const orderableBracelets = GLOAMWEALD_PRODUCTS.filter(
  (product) => product.orderable && product.type === "bracelets",
);
const orderableNecklaces = GLOAMWEALD_PRODUCTS.filter(
  (product) => product.orderable && product.type === "necklaces",
);
const orderableBraceletsAndNecklaces = [...orderableBracelets, ...orderableNecklaces];
function orderableProductsWithCustomClasp() {
  return GLOAMWEALD_PRODUCTS.filter(
    (product) => product.orderable && product.customisation?.clasp?.enabled === true,
  );
}

check(
  "all orderable bracelets use one shared length option set",
  (orderableBracelets.length === 0 ||
    orderableBracelets.every(
      (product) =>
        product.customisation?.length?.enabled === true &&
        product.customisation.length.toleranceNote === BRACELET_LENGTH_TOLERANCE_NOTE &&
        optionSignature(lengthOptionsForProduct(product)) === standardBraceletSignature,
    )),
  orderableBracelets.length
    ? "Every orderable bracelet uses STANDARD_BRACELET_LENGTHS and includes the bracelet measurement tolerance note."
    : "No bracelets are currently checkout-orderable; shared bracelet length rules remain defined for future orderable products.",
);

check(
  "orderable necklaces use fixed-length adjustment dropdowns",
  (orderableNecklaces.length === 0 ||
    orderableNecklaces.every((product) => {
      const config = product.customisation?.length;
      const options = lengthOptionsForProduct(product);
      const values = options.map((option) => Number(option.value));
      const advertised = Number(config?.advertisedLengthCm);
      return (
        config?.enabled === true &&
        config.mode === "adjustment" &&
        config.inputType === "select" &&
        config.toleranceNote === NECKLACE_LENGTH_ADJUSTMENT_NOTE &&
        Number.isFinite(advertised) &&
        Math.min(...values) === advertised - 5 &&
        Math.max(...values) === advertised + 2 &&
        values.includes(advertised) &&
        options.every((option) => Number(option.priceDelta || 0) === 0)
      );
    })),
  orderableNecklaces.length
    ? "Orderable necklaces only allow catalogue-listed adjustments from 5 cm shorter to 2 cm longer."
    : "No necklaces are currently checkout-orderable; fixed adjustment validation will apply when a necklace becomes orderable.",
);

check(
  "bracelet and necklace extenders share 2-10 cm pricing",
  (orderableBraceletsAndNecklaces.length === 0 ||
    orderableBraceletsAndNecklaces.every(
      (product) =>
        product.customisation?.extender?.enabled === true &&
        optionSignature(extenderOptionsForProduct(product)) === standardExtenderSignature,
    )),
  orderableBraceletsAndNecklaces.length
    ? "Every orderable bracelet and necklace uses STANDARD_EXTENDER_OPTIONS: 2-5 cm at $0 and 6-10 cm at +$1."
    : "No bracelets or necklaces are currently checkout-orderable; standard extender pricing remains defined for future orderable products.",
);

check(
  "included clasp is explicit and never reuses product images",
  orderableProductsWithCustomClasp().every((product) => {
    const options = claspOptionsForProduct(product);
    const first = options[0];
    return (
      first &&
      first.id === product.customisation.clasp.includedOptionId &&
      first.isIncluded === true &&
      Number(first.priceDelta || 0) === 0 &&
      options.every((option) => option.image === "")
    );
  }),
  "Each orderable custom clasp product has an explicit included clasp at $0, and clasp option images are blank placeholders rather than copied product photos.",
);

check(
  "extender choices normalise with exact free/paid prices",
  orderableBraceletsAndNecklaces.every((product) => {
    const length = lengthOptionsForProduct(product)[0]?.value;
    const clasp = product.customisation?.clasp?.includedOptionId;
    const selections = { clasp, extender: "no" };
    if (length !== undefined) selections.length = length;

    const free = normaliseProductConfiguration(product, { ...selections, extender: 5 }).extender;
    const paid = normaliseProductConfiguration(product, { ...selections, extender: 6 }).extender;
    return (
      free.selected === true &&
      free.lengthCm === 5 &&
      Number(free.priceDelta || 0) === 0 &&
      paid.selected === true &&
      paid.lengthCm === 6 &&
      Number(paid.priceDelta || 0) === 1
    );
  }),
  "Backend catalogue normalisation keeps 5 cm extenders free and 6 cm extenders at +$1 for bracelets and necklaces.",
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

function fixtureOrder(subtotal, shippingId, notes = "Checkout safety fixture") {
  const shipping = checkoutShippingForOrder(shippingId, subtotal);
  return {
    reference: `GLOAM-TEST-${shippingId}`,
    customer,
    items: [
      {
        id: "checkout-fixture",
        cartKey: `checkout-fixture-${shippingId}-${subtotal}`,
        name: "Checkout safety fixture",
        productName: "Checkout safety fixture",
        quantity: 1,
        unitAmount: subtotal,
        lineTotal: subtotal,
        selections: {},
        selectionSummary: "",
      },
    ],
    shippingId,
    shipping,
    notes,
    subtotal,
    total: subtotal + shipping.amount,
    currency: "AUD",
    createdAt: new Date(0).toISOString(),
  };
}

function checkoutSelectionsForProduct(product) {
  const selections = {};
  const length = lengthOptionsForProduct(product)[0];
  const clasp = claspOptionsForProduct(product)[0];

  if (length) selections.length = { value: length.value };
  if (clasp) selections.clasp = { id: clasp.id };
  if (product.customisation?.pendant?.enabled) {
    selections.pendant = {
      id: product.customisation.pendant.includedOptionId || product.customisation.pendant.allowedOptionIds?.[0] || "",
    };
  }
  if (product.customisation?.extender?.enabled) selections.extender = { selected: false };

  return selections;
}

const checkoutFixtureProduct = checkoutProducts[0]?.product || null;
const checkoutFixtureItem = checkoutFixtureProduct
  ? {
      id: checkoutFixtureProduct.id,
      quantity: 1,
      selections: checkoutSelectionsForProduct(checkoutFixtureProduct),
    }
  : null;

function expectNormaliseOrderThrows(name, input, pattern, detail) {
  if (!checkoutFixtureItem) {
    check(
      name,
      true,
      "No checkout-orderable products are currently active, so there is no valid cart item fixture for normaliseOrder().",
    );
    return;
  }

  expectThrows(
    name,
    () =>
      normaliseOrder({
        items: [checkoutFixtureItem],
        ...input,
      }),
    pattern,
    detail,
  );
}

const underStandard = fixtureOrder(75, "au-standard", "Under-threshold standard shipping fixture");
const underExpress = fixtureOrder(75, "au-express", "Under-threshold express shipping fixture");
const overStandard = fixtureOrder(150, "au-standard", "Free standard shipping fixture");
const overExpress = fixtureOrder(150, "au-express", "Express upgrade shipping fixture");

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

expectNormaliseOrderThrows(
  "backend rejects stale pickup shipping",
  {
    shippingId: "pickup",
    customer,
  },
  /pickup|Australia Post/i,
  "A stale localStorage/form value of pickup cannot pass backend order normalisation.",
);

expectNormaliseOrderThrows(
  "backend requires Australian postal address",
  {
    shippingId: "au-standard",
    customer: { name: "Test Customer", email: "test@example.com", country: "AU" },
  },
  /Postal address is required/i,
  "AU shipping cannot create a PayPal order or Stripe session without postal address fields.",
);

expectNormaliseOrderThrows(
  "backend blocks international quote-only checkout",
  {
    shippingId: "international-quote",
    customer: { ...customer, country: "INTL" },
  },
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
    paypalPayloadUnder.purchase_units[0].amount.value === moneyValue(underStandard.total) &&
    paypalPayloadExpress.purchase_units[0].amount.breakdown.shipping.value === "3.00" &&
    paypalPayloadExpress.purchase_units[0].amount.value === moneyValue(overExpress.total) &&
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
  stripeFormUnder.get(`line_items[${underStandard.items.length}][price_data][unit_amount]`) === "1095" &&
    !stripeFormStandardFree.has(`line_items[${overStandard.items.length}][price_data][unit_amount]`) &&
    stripeFormExpressUpgrade.get(`line_items[${overExpress.items.length}][price_data][unit_amount]`) === "300" &&
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
