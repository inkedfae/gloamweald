import {
  requireEnv,
  retrieveStripeCheckoutSession,
  sendStripeOrderEmailOnce,
  updateStripeCheckoutSessionMetadata,
} from "./checkout-shared.js";

const CURRENCY = "AUD";
const DEFAULT_RESEND_FROM = "Gloamweald <onboarding@resend.dev>";
const CARE_PAGE_URL = "https://gloamweald.com/care.html";

function moneyValue(amount) {
  return Number(amount || 0).toFixed(2);
}

function safeText(value, maxLength = 400) {
  return String(value || "").trim().slice(0, maxLength);
}

function paypalCaptureId(captureData = {}) {
  return captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";
}

function customerNotesText(notes) {
  return String(notes || "").trim() || "No notes provided.";
}

function orderShippingAddressLines(order) {
  if (!order.shipping.requiresAddress) return ["Pickup / hand-off"];
  const locality = [order.customer.city, order.customer.state, order.customer.postcode]
    .filter(Boolean)
    .join(" ");
  return [order.customer.address1, order.customer.address2, locality, "Australia"].filter(Boolean);
}

function orderItemSummaryLines(order) {
  return order.items.map(
    (item) =>
      `${item.quantity} x ${item.name} — $${moneyValue(item.unitAmount)} ${CURRENCY} each ` +
      `(line $${moneyValue(item.lineTotal)} ${CURRENCY})`,
  );
}

function paypalMerchantEmailText(order, captureData = {}) {
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

function customerOrderEmailTextFromOrder(order, { paymentMethod, paypalOrderId = "", paypalCaptureId = "" }) {
  return [
    "Your Gloamweald order is confirmed",
    "",
    `Thank you, ${order.customer.name}. Your payment was successful, and your order has been received.`,
    "",
    "Order details",
    ...orderItemSummaryLines(order),
    "",
    `Subtotal: $${moneyValue(order.subtotal)} ${CURRENCY}`,
    `Shipping / pickup: ${order.shipping.label} — $${moneyValue(order.shipping.amount)} ${CURRENCY}`,
    `Total paid: $${moneyValue(order.total)} ${CURRENCY}`,
    "",
    "Customer",
    order.customer.name,
    order.customer.email,
    order.customer.phone || null,
    "",
    "Shipping / pickup details",
    ...orderShippingAddressLines(order),
    "",
    "Customer notes",
    customerNotesText(order.notes),
    "",
    "Payment",
    `Method: ${paymentMethod}`,
    paypalOrderId ? `PayPal order ID: ${paypalOrderId}` : null,
    paypalCaptureId ? `PayPal capture ID: ${paypalCaptureId}` : null,
    "",
    `To help your piece keep its glimmer, please read the care guide: ${CARE_PAGE_URL}`,
    "",
    "Thank you for choosing Gloamweald.",
    "Gloamweald",
  ]
    .filter((line) => line !== null && String(line).trim() !== "")
    .join("\n");
}

function joinMetadataValue(metadata, prefix, maxParts = 4) {
  return Array.from({ length: maxParts }, (_, index) => metadata?.[`${prefix}_${index + 1}`] || "")
    .join("")
    .trim();
}

function stripeItemSummaryLines(session) {
  const metadata = session.metadata || {};
  const currency = metadata.currency || CURRENCY;
  const items = joinMetadataValue(metadata, "items");
  if (!items) return ["See Stripe Checkout receipt."];

  return items
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+x\s+(.+)\s+-\s+\$([0-9]+(?:\.[0-9]{1,2})?)\s+([A-Z]{3})$/);
      if (!match) return line;

      const quantity = Number(match[1]) || 1;
      const name = match[2];
      const lineTotal = Number(match[3]) || 0;
      const itemCurrency = match[4] || currency;
      const unitAmount = lineTotal / quantity;

      return `${quantity} x ${name} — $${moneyValue(unitAmount)} ${itemCurrency} each ` +
        `(line $${moneyValue(lineTotal)} ${itemCurrency})`;
    });
}

function stripeShippingAddressLines(session) {
  const metadata = session.metadata || {};
  if (metadata.shipping_id === "pickup") return ["Pickup / hand-off"];
  return [
    metadata.address1,
    metadata.address2,
    [metadata.city, metadata.state, metadata.postcode].filter(Boolean).join(" "),
    metadata.country || "AU",
  ].filter(Boolean);
}

function stripeCustomerOrderEmailText(session) {
  const metadata = session.metadata || {};
  const customer = session.customer_details || {};
  const customerName = metadata.customer_name || customer.name || "there";
  const customerEmail = metadata.customer_email || customer.email || "";
  const notes = joinMetadataValue(metadata, "notes");
  const paidAmount = session.amount_total ? moneyValue(session.amount_total / 100) : metadata.total;

  return [
    "Your Gloamweald order is confirmed",
    "",
    `Thank you, ${customerName}. Your card payment was successful, and your order has been received.`,
    "",
    "Order details",
    ...stripeItemSummaryLines(session),
    "",
    `Subtotal: $${metadata.subtotal || ""} ${metadata.currency || CURRENCY}`,
    `Shipping / pickup: ${metadata.shipping_label || ""} — $${metadata.shipping_amount || "0.00"} ${metadata.currency || CURRENCY}`,
    `Total paid: $${paidAmount || metadata.total || ""} ${metadata.currency || CURRENCY}`,
    "",
    "Customer",
    customerName,
    customerEmail,
    metadata.customer_phone || customer.phone || null,
    "",
    "Shipping / pickup details",
    ...stripeShippingAddressLines(session),
    "",
    "Customer notes",
    customerNotesText(notes === "None" ? "" : notes),
    "",
    "Payment",
    "Method: Card",
    `Stripe session ID: ${session.id || ""}`,
    `Stripe payment intent ID: ${session.payment_intent || ""}`,
    "",
    `To help your piece keep its glimmer, please read the care guide: ${CARE_PAGE_URL}`,
    "",
    "Thank you for choosing Gloamweald.",
    "Gloamweald",
  ]
    .filter((line) => line !== null && String(line).trim() !== "")
    .join("\n");
}

async function sendResendEmail(env, { to, replyTo, subject, text, idempotencyKey }) {
  const headers = {
    Authorization: `Bearer ${requireEnv(env, "RESEND_API_KEY")}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: env.RESEND_FROM || DEFAULT_RESEND_FROM,
      to: [to],
      reply_to: replyTo,
      subject,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Order email could not be sent.");
  return data;
}

async function sendPayPalMerchantOrderEmail(env, order, captureData) {
  const captureId = paypalCaptureId(captureData);
  return sendResendEmail(env, {
    to: requireEnv(env, "CONTACT_EMAIL"),
    replyTo: order.customer.email,
    subject: `GLOAMWEALD PayPal order ${order.reference}`,
    text: paypalMerchantEmailText(order, captureData),
    idempotencyKey: `gloamweald-paypal-merchant-email-${captureId || order.paypalOrderId || order.reference}`,
  });
}

async function sendPayPalCustomerOrderEmail(env, order, captureData) {
  const captureId = paypalCaptureId(captureData);
  return sendResendEmail(env, {
    to: order.customer.email,
    replyTo: requireEnv(env, "CONTACT_EMAIL"),
    subject: "Your Gloamweald order is confirmed",
    text: customerOrderEmailTextFromOrder(order, {
      paymentMethod: "PayPal",
      paypalOrderId: captureData.id || order.paypalOrderId || "",
      paypalCaptureId: captureId,
    }),
    idempotencyKey: `gloamweald-paypal-customer-email-${captureId || order.paypalOrderId || order.reference}`,
  });
}

export async function sendPayPalOrderEmails(env, order, captureData) {
  const [merchantEmail, customerEmail] = await Promise.allSettled([
    sendPayPalMerchantOrderEmail(env, order, captureData),
    sendPayPalCustomerOrderEmail(env, order, captureData),
  ]);

  return {
    merchantEmailSent: merchantEmail.status === "fulfilled",
    customerEmailSent: customerEmail.status === "fulfilled",
    merchantError: merchantEmail.status === "rejected" ? merchantEmail.reason?.message || "Merchant email failed." : "",
    customerError: customerEmail.status === "rejected" ? customerEmail.reason?.message || "Customer email failed." : "",
  };
}

function stripeCustomerEmailAlreadySent(session) {
  return session?.metadata?.gloamweald_customer_email_sent === "true";
}

async function markStripeCustomerEmailSent(env, session, resendResponse = {}) {
  return updateStripeCheckoutSessionMetadata(env, session.id, {
    gloamweald_customer_email_sent: "true",
    gloamweald_customer_email_sent_at: new Date().toISOString(),
    gloamweald_customer_resend_email_id: safeText(resendResponse.id, 200),
  });
}

async function sendStripeCustomerOrderEmail(env, session) {
  const metadata = session.metadata || {};
  const customerEmail = metadata.customer_email || session.customer_details?.email || "";
  if (!customerEmail) throw new Error("Stripe customer email is missing.");

  return sendResendEmail(env, {
    to: customerEmail,
    replyTo: requireEnv(env, "CONTACT_EMAIL"),
    subject: "Your Gloamweald order is confirmed",
    text: stripeCustomerOrderEmailText(session),
    idempotencyKey: `gloamweald-stripe-customer-email-${session.id}`,
  });
}

export async function sendStripeOrderEmailsOnce(env, session) {
  if (!session?.id) throw new Error("Stripe Checkout Session ID is missing.");

  const result = {
    merchantEmailSent: false,
    customerEmailSent: false,
    customerEmailSkipped: false,
    errors: [],
  };

  try {
    const merchantResult = await sendStripeOrderEmailOnce(env, session);
    result.merchantEmailSent = Boolean(merchantResult.sent || merchantResult.merchantEmailSent);
  } catch (error) {
    result.errors.push(error.message || "Stripe merchant email failed.");
  }

  const latestSession = await retrieveStripeCheckoutSession(env, session.id);
  result.customerEmailSkipped = stripeCustomerEmailAlreadySent(latestSession);

  if (!result.customerEmailSkipped) {
    try {
      const resendResponse = await sendStripeCustomerOrderEmail(env, latestSession);
      await markStripeCustomerEmailSent(env, latestSession, resendResponse);
      result.customerEmailSent = true;
    } catch (error) {
      result.errors.push(error.message || "Stripe customer email failed.");
    }
  }

  if (result.errors.length) throw new Error(result.errors.join(" "));
  return result;
}
