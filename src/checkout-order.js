import { checkoutProductById } from "./product-catalog.js";

const CURRENCY = "AUD";
const FREE_STANDARD_THRESHOLD = 150;

export const CHECKOUT_SHIPPING_METHODS = Object.freeze({
  "au-standard": {
    label: "Australia Post standard tracked shipping",
    baseAmount: 10.95,
    freeAtSubtotal: FREE_STANDARD_THRESHOLD,
    requiresAddress: true,
    countries: ["AU"],
  },
  "au-express": {
    label: "Australia Post express tracked shipping",
    baseAmount: 13.95,
    upgradeAmountAtFreeStandard: 3,
    freeStandardThreshold: FREE_STANDARD_THRESHOLD,
    requiresAddress: true,
    countries: ["AU"],
  },
  "international-quote": {
    label: "International shipping quote",
    baseAmount: null,
    requiresAddress: true,
    countries: ["INTL"],
    quoteRequired: true,
  },
});

export function moneyValue(amount) {
  return Number(amount || 0).toFixed(2);
}

function safeText(value, maxLength = 400) {
  return String(value || "").trim().slice(0, maxLength);
}

export function checkoutShippingAmount(shippingId, subtotal) {
  const method = CHECKOUT_SHIPPING_METHODS[shippingId];
  if (!method || method.quoteRequired || method.baseAmount === null) return null;

  if (shippingId === "au-standard" && subtotal >= FREE_STANDARD_THRESHOLD) return 0;
  if (shippingId === "au-express" && subtotal >= FREE_STANDARD_THRESHOLD) {
    return method.upgradeAmountAtFreeStandard;
  }

  return method.baseAmount;
}

export function checkoutShippingForOrder(shippingId, subtotal) {
  const method = CHECKOUT_SHIPPING_METHODS[shippingId];
  if (!method) throw new Error("Choose a valid shipping method.");

  const amount = checkoutShippingAmount(shippingId, subtotal);
  if (amount === null || method.quoteRequired) {
    throw new Error("International shipping needs a custom quote before payment.");
  }

  return {
    label: method.label,
    amount,
    requiresAddress: Boolean(method.requiresAddress),
  };
}

export function checkoutShippingOptions(country, subtotal) {
  if (country !== "AU") {
    return [
      {
        id: "international-quote",
        label: CHECKOUT_SHIPPING_METHODS["international-quote"].label,
        amount: null,
        detail: "International shipping needs a custom quote before payment. Contact Gloamweald before ordering.",
      },
    ];
  }

  return ["au-standard", "au-express"].map((id) => ({
    id,
    label: CHECKOUT_SHIPPING_METHODS[id].label,
    amount: checkoutShippingAmount(id, subtotal),
    detail:
      id === "au-standard"
        ? "Australia Post standard tracked shipping. Free on Australian orders of $150 or more."
        : "Australia Post express tracked shipping. $3 upgrade on Australian orders of $150 or more.",
  }));
}

function normaliseItems(input) {
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
  return items;
}

function normaliseCustomer(input = {}) {
  const customer = {
    name: safeText(input.name, 180),
    email: safeText(input.email, 180),
    phone: safeText(input.phone, 80),
    address1: safeText(input.address1, 180),
    address2: safeText(input.address2, 180),
    city: safeText(input.city, 120),
    state: safeText(input.state, 120),
    postcode: safeText(input.postcode, 40),
    country: safeText(input.country || "AU", 10),
  };

  if (!customer.name) throw new Error("Name is required.");
  if (!customer.email || !customer.email.includes("@")) throw new Error("A valid email is required.");
  return customer;
}

function assertAustralianAddress(customer, shipping) {
  if (!shipping.requiresAddress) return;

  if (customer.country !== "AU") {
    throw new Error("International shipping needs a custom quote before payment.");
  }

  ["address1", "city", "state", "postcode"].forEach((field) => {
    if (!customer[field]) throw new Error("Postal address is required for Australian shipping.");
  });
}

function orderReference() {
  const random = new Uint8Array(3);
  crypto.getRandomValues(random);
  const suffix = [...random].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `GLOAM-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

export function normaliseOrder(input) {
  const items = normaliseItems(input);
  const customer = normaliseCustomer(input.customer);
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const shippingId = safeText(input.shippingId || "au-standard", 80);

  if (shippingId === "pickup") {
    throw new Error("Local pickup is not available as a standard checkout option. Choose Australia Post shipping.");
  }

  const shipping = checkoutShippingForOrder(shippingId, subtotal);
  assertAustralianAddress(customer, shipping);

  const total = subtotal + shipping.amount;

  return {
    reference: orderReference(),
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
