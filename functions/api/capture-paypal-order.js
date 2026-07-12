import {
  assertCheckoutConfigured,
  json,
  parseJsonBody,
  paypalAccessToken,
  paypalBaseUrl,
  verifyOrderToken,
} from "../../src/checkout-shared.js";
import { sendPayPalOrderEmails } from "../../src/customer-order-emails.js";

/*
  Cloudflare Pages route:
  /functions/api/capture-paypal-order.js -> /api/capture-paypal-order

  The PayPal Client Secret and Resend API key are read only from context.env.
  Do not add either value to frontend files.
*/
export async function onRequestPost(context) {
  try {
    assertCheckoutConfigured(context.env);
    const input = await parseJsonBody(context.request);
    const orderID = String(input.orderID || "");
    const order = await verifyOrderToken(context.env, input.orderToken);

    if (!orderID || order.paypalOrderId !== orderID) {
      return json(400, { error: "PayPal order did not match the signed checkout details." });
    }

    const accessToken = await paypalAccessToken(context.env);
    const response = await fetch(`${paypalBaseUrl(context.env)}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${order.reference}-capture`,
      },
    });

    const captureData = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(response.status, {
        error: captureData.message || captureData.name || "PayPal capture could not be completed.",
        details: captureData.details || [],
      });
    }

    const captureID = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";
    const emailResult = await sendPayPalOrderEmails(context.env, order, captureData);

    if (!emailResult.merchantEmailSent || !emailResult.customerEmailSent) {
      return json(200, {
        warning: "Payment was captured, but one or more order emails could not be sent. Contact Gloamweald with the PayPal order ID.",
        orderID,
        captureID,
        emailSent: emailResult.merchantEmailSent,
        merchantEmailSent: emailResult.merchantEmailSent,
        customerEmailSent: emailResult.customerEmailSent,
      });
    }

    return json(200, {
      orderID,
      captureID,
      emailSent: true,
      merchantEmailSent: true,
      customerEmailSent: true,
    });
  } catch (error) {
    return json(400, { error: error.message });
  }
}

export function onRequest() {
  return json(405, { error: "Method not allowed" });
}
