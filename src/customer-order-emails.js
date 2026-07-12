import {
  requireEnv,
  retrieveStripeCheckoutSession,
  updateStripeCheckoutSessionMetadata,
} from "./checkout-shared.js";

const CURRENCY = "AUD";
const DEFAULT_RESEND_FROM = "Gloamweald <onboarding@resend.dev>";
const CARE_PAGE_URL = "https://gloamweald.com/care.html";

function moneyValue(amount) {
  return Number(amount || 0).toFixed(2);
}

function moneyLine(amount, currency = CURRENCY) {
  return `$${moneyValue(amount)} ${currency}`;
}

function safeText(value, maxLength = 400) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paypalCaptureId(captureData = {}) {
  return captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";
}

function joinMetadataValue(metadata, prefix, maxParts = 4) {
  return Array.from({ length: maxParts }, (_, index) => metadata?.[`${prefix}_${index + 1}`] || "")
    .join("")
    .trim();
}

function deliveryAddressLines(customer = {}, requiresAddress = true) {
  if (!requiresAddress) return ["No postal address recorded"];
  const locality = [customer.city, customer.state, customer.postcode].filter(Boolean).join(" ");
  return [customer.address1, customer.address2, locality, "Australia"].filter(Boolean);
}

function notesBlock(notes, contactEmail) {
  const cleanNotes = String(notes || "").trim();
  if (cleanNotes) {
    return {
      text: ["We received your message:", cleanNotes],
      html: `<p style="margin:0 0 8px;">We received your message:</p><blockquote style="margin:0;padding:12px 14px;border-left:3px solid #8f7d64;background:#151716;color:#f5eee6;">${escapeHtml(cleanNotes)}</blockquote>`,
    };
  }

  return {
    text: [
      "No message or custom notes were included with this order.",
      "",
      `If that was a mistake, you can reply to this email or contact ${contactEmail} with your order reference.`,
    ],
    html: `<p style="margin:0 0 8px;">No message or custom notes were included with this order.</p><p style="margin:0;">If that was a mistake, you can reply to this email or contact ${escapeHtml(contactEmail)} with your order reference.</p>`,
  };
}

function orderItemRows(order) {
  return order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitAmount: item.unitAmount,
    lineTotal: item.lineTotal,
    currency: order.currency || CURRENCY,
  }));
}

function stripeItemRows(session) {
  const metadata = session.metadata || {};
  const currency = metadata.currency || CURRENCY;
  const items = joinMetadataValue(metadata, "items");
  if (!items) {
    return [
      {
        name: "See Stripe Checkout receipt",
        quantity: 1,
        unitAmount: 0,
        lineTotal: 0,
        currency,
      },
    ];
  }

  return items
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+x\s+(.+)\s+-\s+\$([0-9]+(?:\.[0-9]{1,2})?)\s+([A-Z]{3})$/);
      if (!match) {
        return { name: line, quantity: 1, unitAmount: 0, lineTotal: 0, currency };
      }

      const quantity = Number(match[1]) || 1;
      const lineTotal = Number(match[3]) || 0;
      return {
        quantity,
        name: match[2],
        unitAmount: lineTotal / quantity,
        lineTotal,
        currency: match[4] || currency,
      };
    });
}

function textOrderTable(rows) {
  return [
    "Item | Quantity | Price | Total",
    ...rows.map(
      (item) =>
        `${item.name} | ${item.quantity} | ${moneyLine(item.unitAmount, item.currency)} | ${moneyLine(item.lineTotal, item.currency)}`,
    ),
  ];
}

function htmlOrderTable(rows) {
  const cell = "padding:10px;border-bottom:1px solid #2c302d;text-align:left;";
  const numeric = `${cell}text-align:right;white-space:nowrap;`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:12px 0 18px;color:#f5eee6;">
      <thead>
        <tr>
          <th style="${cell}color:#c9b99f;">Item</th>
          <th style="${numeric}color:#c9b99f;">Quantity</th>
          <th style="${numeric}color:#c9b99f;">Price</th>
          <th style="${numeric}color:#c9b99f;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (item) => `
              <tr>
                <td style="${cell}">${escapeHtml(item.name)}</td>
                <td style="${numeric}">${escapeHtml(item.quantity)}</td>
                <td style="${numeric}">${escapeHtml(moneyLine(item.unitAmount, item.currency))}</td>
                <td style="${numeric}">${escapeHtml(moneyLine(item.lineTotal, item.currency))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function customerEmailText({
  customerName,
  customerEmail,
  customerPhone,
  items,
  totalPaid,
  currency = CURRENCY,
  paymentMethod,
  orderReference,
  paymentReference,
  extraPaymentReferences = [],
  shippingLabel,
  shippingCost,
  addressLines,
  notes,
  contactEmail,
}) {
  const notesText = notesBlock(notes, contactEmail).text;

  return [
    `Greetings, ${customerName}`,
    "",
    "Thank you for placing an order from Gloamweald.",
    "",
    "Your offering has been received, and your payment is confirmed.",
    "",
    `Total received: ${moneyLine(totalPaid, currency)}`,
    `Payment method: ${paymentMethod}`,
    `Order reference: ${orderReference}`,
    `Payment reference: ${paymentReference}`,
    ...extraPaymentReferences,
    "",
    "Joining you will be:",
    "",
    ...textOrderTable(items),
    "",
    "Delivery",
    shippingLabel,
    `Shipping cost: ${moneyLine(shippingCost, currency)}`,
    ...addressLines,
    "",
    "Contact details",
    `Name: ${customerName}`,
    `Email: ${customerEmail}`,
    customerPhone ? `Phone: ${customerPhone}` : null,
    "",
    "Customer notes",
    ...notesText,
    "",
    "To help your piece last, please read the care guide:",
    "",
    CARE_PAGE_URL,
    "",
    "Great care is taken with each piece. Some materials and components may be more delicate than others, so please refer to the care guide before regular wear.",
    "",
    `For care, quality, damage, or repair questions, reply to this email or contact ${contactEmail} with your order reference.`,
    "",
    "Thank you again,",
    "",
    "Gloamweald",
  ]
    .filter((line) => line !== null && String(line).trim() !== "")
    .join("\n");
}

function customerEmailHtml({
  customerName,
  customerEmail,
  customerPhone,
  items,
  totalPaid,
  currency = CURRENCY,
  paymentMethod,
  orderReference,
  paymentReference,
  extraPaymentReferences = [],
  shippingLabel,
  shippingCost,
  addressLines,
  notes,
  contactEmail,
}) {
  const notesHtml = notesBlock(notes, contactEmail).html;
  const extraRefs = extraPaymentReferences
    .map((line) => `<p style="margin:0 0 4px;">${escapeHtml(line)}</p>`)
    .join("");

  return `
    <div style="margin:0;padding:0;background:#090b0a;color:#f5eee6;font-family:Georgia,'Times New Roman',serif;line-height:1.55;">
      <div style="max-width:680px;margin:0 auto;padding:28px 20px;">
        <div style="border:1px solid #2c302d;background:#101211;padding:24px;">
          <h1 style="margin:0 0 16px;color:#f5eee6;font-size:26px;">Your Gloamweald order is confirmed</h1>
          <p style="margin:0 0 14px;">Greetings, ${escapeHtml(customerName)}</p>
          <p style="margin:0 0 14px;">Thank you for placing an order from Gloamweald.</p>
          <p style="margin:0 0 20px;">Your offering has been received, and your payment is confirmed.</p>

          <h2 style="margin:24px 0 8px;color:#c9b99f;font-size:18px;">Payment details</h2>
          <p style="margin:0 0 4px;">Total received: ${escapeHtml(moneyLine(totalPaid, currency))}</p>
          <p style="margin:0 0 4px;">Payment method: ${escapeHtml(paymentMethod)}</p>
          <p style="margin:0 0 4px;">Order reference: ${escapeHtml(orderReference)}</p>
          <p style="margin:0 0 4px;">Payment reference: ${escapeHtml(paymentReference)}</p>
          ${extraRefs}

          <h2 style="margin:24px 0 8px;color:#c9b99f;font-size:18px;">Joining you will be:</h2>
          ${htmlOrderTable(items)}

          <h2 style="margin:24px 0 8px;color:#c9b99f;font-size:18px;">Delivery</h2>
          <p style="margin:0 0 4px;">${escapeHtml(shippingLabel)}</p>
          <p style="margin:0 0 8px;">Shipping cost: ${escapeHtml(moneyLine(shippingCost, currency))}</p>
          ${addressLines.map((line) => `<p style="margin:0 0 4px;">${escapeHtml(line)}</p>`).join("")}

          <h2 style="margin:24px 0 8px;color:#c9b99f;font-size:18px;">Contact details</h2>
          <p style="margin:0 0 4px;">Name: ${escapeHtml(customerName)}</p>
          <p style="margin:0 0 4px;">Email: ${escapeHtml(customerEmail)}</p>
          ${customerPhone ? `<p style="margin:0 0 4px;">Phone: ${escapeHtml(customerPhone)}</p>` : ""}

          <h2 style="margin:24px 0 8px;color:#c9b99f;font-size:18px;">Customer notes</h2>
          ${notesHtml}

          <h2 style="margin:24px 0 8px;color:#c9b99f;font-size:18px;">Care</h2>
          <p style="margin:0 0 10px;">To help your piece last, please read the care guide:</p>
          <p style="margin:0 0 14px;"><a href="${CARE_PAGE_URL}" style="color:#d9c4a3;">${CARE_PAGE_URL}</a></p>
          <p style="margin:0 0 14px;">Great care is taken with each piece. Some materials and components may be more delicate than others, so please refer to the care guide before regular wear.</p>
          <p style="margin:0 0 20px;">For care, quality, damage, or repair questions, reply to this email or contact ${escapeHtml(contactEmail)} with your order reference.</p>

          <p style="margin:0 0 6px;">Thank you again,</p>
          <p style="margin:0;">Gloamweald</p>
        </div>
      </div>
    </div>
  `;
}

function paypalMerchantEmailText(order, captureData = {}) {
  const purchaseUnit = captureData.purchase_units?.[0] || {};
  const capture = purchaseUnit.payments?.captures?.[0] || {};
  const payerEmail = captureData.payment_source?.paypal?.email_address || "";

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
    ...order.items.map((item) => `${item.quantity} x ${item.name} - ${moneyLine(item.lineTotal, order.currency)}`),
    "",
    `Subtotal: ${moneyLine(order.subtotal, order.currency)}`,
    `Shipping: ${moneyLine(order.shipping.amount, order.currency)} (${order.shipping.label})`,
    `Total: ${moneyLine(order.total, order.currency)}`,
    "",
    "Customer",
    order.customer.name,
    order.customer.email,
    order.customer.phone || null,
    "",
    "Delivery details",
    order.shipping.label,
    ...deliveryAddressLines(order.customer, order.shipping.requiresAddress),
    "",
    "Customer notes / length adjustment requests",
    order.notes || "None",
  ]
    .filter((line) => line !== null && String(line).trim() !== "")
    .join("\n");
}

function paypalCustomerEmailPayload(env, order, captureData) {
  const contactEmail = requireEnv(env, "CONTACT_EMAIL");
  const captureId = paypalCaptureId(captureData);
  const paypalOrderId = captureData.id || order.paypalOrderId || "";
  const payload = {
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone,
    items: orderItemRows(order),
    totalPaid: order.total,
    currency: order.currency || CURRENCY,
    paymentMethod: "PayPal",
    orderReference: order.reference,
    paymentReference: captureId || paypalOrderId,
    extraPaymentReferences: [`PayPal order ID: ${paypalOrderId}`, `PayPal capture ID: ${captureId}`].filter(
      (line) => !line.endsWith(": "),
    ),
    shippingLabel: order.shipping.label,
    shippingCost: order.shipping.amount,
    addressLines: deliveryAddressLines(order.customer, order.shipping.requiresAddress),
    notes: order.notes,
    contactEmail,
  };

  return {
    text: customerEmailText(payload),
    html: customerEmailHtml(payload),
  };
}

function stripeMetadataCustomer(session) {
  const metadata = session.metadata || {};
  const customer = session.customer_details || {};
  return {
    name: metadata.customer_name || customer.name || "there",
    email: metadata.customer_email || customer.email || "",
    phone: metadata.customer_phone || customer.phone || "",
    address1: metadata.address1 || "",
    address2: metadata.address2 || "",
    city: metadata.city || "",
    state: metadata.state || "",
    postcode: metadata.postcode || "",
    country: metadata.country || "AU",
  };
}

function stripeAddressLines(session) {
  return deliveryAddressLines(stripeMetadataCustomer(session), true);
}

function stripeMerchantEmailText(session) {
  const metadata = session.metadata || {};
  const customer = stripeMetadataCustomer(session);
  const notes = joinMetadataValue(metadata, "notes") || "None";
  const currency = metadata.currency || CURRENCY;
  const paidAmount = session.amount_total ? moneyValue(session.amount_total / 100) : metadata.total;

  return [
    "GLOAMWEALD Stripe order",
    "",
    `Reference: ${metadata.reference || session.client_reference_id || ""}`,
    `Stripe Checkout Session ID: ${session.id || ""}`,
    `Stripe Payment Intent ID: ${session.payment_intent || ""}`,
    `Stripe status: ${session.status || ""}`,
    `Stripe payment status: ${session.payment_status || ""}`,
    customer.email ? `Stripe payer email: ${customer.email}` : null,
    "",
    "Items",
    ...stripeItemRows(session).map((item) => `${item.quantity} x ${item.name} - ${moneyLine(item.lineTotal, item.currency)}`),
    "",
    `Subtotal: $${metadata.subtotal || ""} ${currency}`,
    `Shipping: $${metadata.shipping_amount || ""} ${currency} (${metadata.shipping_label || ""})`,
    `Total: $${paidAmount || metadata.total || ""} ${currency}`,
    "",
    "Customer",
    customer.name,
    customer.email,
    customer.phone || null,
    "",
    "Delivery details",
    metadata.shipping_label || "",
    ...stripeAddressLines(session),
    "",
    "Customer notes / length adjustment requests",
    notes === "None" ? "None" : notes,
  ]
    .filter((line) => line !== null && String(line).trim() !== "")
    .join("\n");
}

function stripeCustomerEmailPayload(env, session) {
  const metadata = session.metadata || {};
  const customer = stripeMetadataCustomer(session);
  const contactEmail = requireEnv(env, "CONTACT_EMAIL");
  const currency = metadata.currency || CURRENCY;
  const paidAmount = session.amount_total ? session.amount_total / 100 : Number(metadata.total || 0);
  const notes = joinMetadataValue(metadata, "notes");

  const payload = {
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    items: stripeItemRows(session),
    totalPaid: paidAmount,
    currency,
    paymentMethod: "Card",
    orderReference: metadata.reference || session.client_reference_id || session.id,
    paymentReference: session.payment_intent || session.id,
    extraPaymentReferences: [
      `Stripe session ID: ${session.id || ""}`,
      `Stripe payment intent ID: ${session.payment_intent || ""}`,
    ].filter((line) => !line.endsWith(": ")),
    shippingLabel: metadata.shipping_label || "Australia Post shipping",
    shippingCost: Number(metadata.shipping_amount || 0),
    addressLines: stripeAddressLines(session),
    notes: notes === "None" ? "" : notes,
    contactEmail,
  };

  return {
    text: customerEmailText(payload),
    html: customerEmailHtml(payload),
  };
}

async function sendResendEmail(env, { to, replyTo, subject, text, html, idempotencyKey }) {
  const headers = {
    Authorization: `Bearer ${requireEnv(env, "RESEND_API_KEY")}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const body = {
    from: env.RESEND_FROM || DEFAULT_RESEND_FROM,
    to: [to],
    subject,
    text,
  };

  if (replyTo) body.reply_to = replyTo;
  if (html) body.html = html;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
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
  const email = paypalCustomerEmailPayload(env, order, captureData);
  return sendResendEmail(env, {
    to: order.customer.email,
    replyTo: requireEnv(env, "CONTACT_EMAIL"),
    subject: "Your Gloamweald order is confirmed",
    text: email.text,
    html: email.html,
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

function stripeMerchantEmailAlreadySent(session) {
  return session?.metadata?.gloamweald_order_email_sent === "true";
}

function stripeCustomerEmailAlreadySent(session) {
  return session?.metadata?.gloamweald_customer_email_sent === "true";
}

async function markStripeMerchantEmailSent(env, session, resendResponse = {}) {
  return updateStripeCheckoutSessionMetadata(env, session.id, {
    gloamweald_order_email_sent: "true",
    gloamweald_order_email_sent_at: new Date().toISOString(),
    gloamweald_resend_email_id: safeText(resendResponse.id, 200),
  });
}

async function markStripeCustomerEmailSent(env, session, resendResponse = {}) {
  return updateStripeCheckoutSessionMetadata(env, session.id, {
    gloamweald_customer_email_sent: "true",
    gloamweald_customer_email_sent_at: new Date().toISOString(),
    gloamweald_customer_resend_email_id: safeText(resendResponse.id, 200),
  });
}

async function sendStripeMerchantOrderEmail(env, session) {
  const metadata = session.metadata || {};
  return sendResendEmail(env, {
    to: requireEnv(env, "CONTACT_EMAIL"),
    replyTo: metadata.customer_email || session.customer_details?.email || "",
    subject: `GLOAMWEALD Stripe order ${metadata.reference || session.id}`,
    text: stripeMerchantEmailText(session),
    idempotencyKey: `gloamweald-stripe-order-email-${session.id}`,
  });
}

async function sendStripeCustomerOrderEmail(env, session) {
  const customerEmail = session.metadata?.customer_email || session.customer_details?.email || "";
  if (!customerEmail) throw new Error("Stripe customer email is missing.");

  const email = stripeCustomerEmailPayload(env, session);
  return sendResendEmail(env, {
    to: customerEmail,
    replyTo: requireEnv(env, "CONTACT_EMAIL"),
    subject: "Your Gloamweald order is confirmed",
    text: email.text,
    html: email.html,
    idempotencyKey: `gloamweald-stripe-customer-email-${session.id}`,
  });
}

export async function sendStripeOrderEmailsOnce(env, session) {
  if (!session?.id) throw new Error("Stripe Checkout Session ID is missing.");

  const result = {
    merchantEmailSent: false,
    merchantEmailSkipped: false,
    customerEmailSent: false,
    customerEmailSkipped: false,
    errors: [],
  };

  const latestSession = await retrieveStripeCheckoutSession(env, session.id);

  result.merchantEmailSkipped = stripeMerchantEmailAlreadySent(latestSession);
  if (!result.merchantEmailSkipped) {
    try {
      const resendResponse = await sendStripeMerchantOrderEmail(env, latestSession);
      await markStripeMerchantEmailSent(env, latestSession, resendResponse);
      result.merchantEmailSent = true;
    } catch (error) {
      result.errors.push(error.message || "Stripe merchant email failed.");
    }
  }

  const sessionAfterMerchant = await retrieveStripeCheckoutSession(env, session.id);
  result.customerEmailSkipped = stripeCustomerEmailAlreadySent(sessionAfterMerchant);
  if (!result.customerEmailSkipped) {
    try {
      const resendResponse = await sendStripeCustomerOrderEmail(env, sessionAfterMerchant);
      await markStripeCustomerEmailSent(env, sessionAfterMerchant, resendResponse);
      result.customerEmailSent = true;
    } catch (error) {
      result.errors.push(error.message || "Stripe customer email failed.");
    }
  }

  if (result.errors.length) throw new Error(result.errors.join(" "));
  return result;
}
