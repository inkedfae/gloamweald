(() => {
  "use strict";

  const CART_STORAGE_KEY = "gloamweald-cart";
  const CHECKOUT_CONFIG_ENDPOINT = "/api/checkout-config";
  const CREATE_STRIPE_SESSION_ENDPOINT = "/api/create-stripe-session";
  const CONFIRM_STRIPE_SESSION_ENDPOINT = "/api/confirm-stripe-session";

  const products = window.GLOAMWEALD_PRODUCTS || [];

  function productById(id) {
    return products.find((product) => product.id === id);
  }

  function productPrice(product) {
    const match = String(product?.price || "").match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    return match ? Number(match[1]) : null;
  }

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => ({
          id: String(item.id || ""),
          quantity: Math.max(1, Number(item.quantity) || 1),
        }))
        .filter((item) => {
          const product = productById(item.id);
          return product?.orderable && productPrice(product) !== null;
        });
    } catch {
      return [];
    }
  }

  function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  function formPayload(form) {
    const formData = new FormData(form);

    return {
      customer: {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        address1: String(formData.get("address1") || "").trim(),
        address2: String(formData.get("address2") || "").trim(),
        city: String(formData.get("city") || "").trim(),
        state: String(formData.get("state") || "").trim(),
        postcode: String(formData.get("postcode") || "").trim(),
        country: String(formData.get("country") || "AU").trim(),
      },
      items: readCart(),
      shippingId: String(formData.get("shipping") || "au-standard").trim(),
      notes: String(formData.get("notes") || "").trim(),
    };
  }

  async function readCheckoutConfig() {
    const response = await fetch(CHECKOUT_CONFIG_ENDPOINT, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Checkout config could not be loaded.");
    return data;
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Checkout could not be started.");
    return data;
  }

  function setStripeStatus(message) {
    const status = document.querySelector("[data-stripe-status]");
    if (status) status.textContent = message;
  }

  async function initialiseStripeButton() {
    const button = document.querySelector("[data-stripe-checkout-button]");
    const form = document.querySelector("[data-checkout-form]");
    if (!button || !form) return;

    button.disabled = true;
    setStripeStatus("Checking whether secure card checkout is configured...");

    let config;
    try {
      config = await readCheckoutConfig();
    } catch (error) {
      setStripeStatus(`${error.message} Stripe checkout is disabled for now.`);
      return;
    }

    if (!config.stripeConfigured) {
      setStripeStatus(config.stripeError || "Stripe checkout is not configured yet.");
      return;
    }

    button.disabled = false;
    setStripeStatus("Enter delivery details, choose shipping, then continue to secure Stripe checkout.");

    button.addEventListener("click", async () => {
      const payload = formPayload(form);

      if (!payload.items.length) {
        setStripeStatus("Add something to the cart before starting Stripe checkout.");
        return;
      }

      if (payload.shippingId === "international-quote") {
        setStripeStatus("International shipping needs a custom quote before Stripe payment can be taken.");
        return;
      }

      if (!form.reportValidity()) return;

      try {
        button.disabled = true;
        button.textContent = "Opening Stripe...";
        const session = await postJson(CREATE_STRIPE_SESSION_ENDPOINT, payload);
        if (!session.url) throw new Error("Stripe did not return a checkout link.");
        window.location.assign(session.url);
      } catch (error) {
        button.disabled = false;
        button.textContent = "Continue to Stripe";
        setStripeStatus(error.message);
      }
    });
  }

  function setSuccessText(selectors, value) {
    selectors.forEach((selector) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = value;
    });
  }

  async function confirmStripeSuccess() {
    const panel = document.querySelector("[data-payment-success]");
    if (!panel) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("provider") !== "stripe") return;

    const sessionId = params.get("session_id");
    const warning = panel.querySelector("[data-success-warning]");

    if (!sessionId) {
      if (warning) {
        warning.hidden = false;
        warning.textContent = "Stripe returned without a Checkout Session ID. Contact Gloamweald before trying again.";
      }
      return;
    }

    setSuccessText([".page-hero--cart p:last-child"], "Confirming your Stripe payment with the secure checkout backend...");

    try {
      const response = await fetch(`${CONFIRM_STRIPE_SESSION_ENDPOINT}?${new URLSearchParams({ session_id: sessionId })}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.paid) {
        throw new Error(data.error || "Stripe payment has not been confirmed by the backend.");
      }

      clearCart();
      setSuccessText([".page-hero--cart h1"], "Payment confirmed");
      setSuccessText(
        ["[data-success-message]"],
        "Your cart has been cleared. Keep your Stripe receipt for your records; Gloamweald receives order details from the Stripe webhook.",
      );
      setSuccessText(["[data-success-order-label]"], "Stripe session");
      setSuccessText(["[data-success-capture-label]"], "Payment intent");
      setSuccessText(["[data-success-order]"], data.sessionID || sessionId);
      setSuccessText(["[data-success-capture]"], data.paymentIntent || "Confirmed by Stripe");

      const details = panel.querySelector("[data-success-details]");
      if (details) details.hidden = false;
      if (warning) warning.hidden = true;
    } catch (error) {
      setSuccessText([".page-hero--cart h1"], "Payment not confirmed");
      setSuccessText(
        ["[data-success-message]"],
        "Your cart has not been cleared. Please contact Gloamweald before trying payment again.",
      );
      if (warning) {
        warning.hidden = false;
        warning.textContent = error.message;
      }
    }
  }

  initialiseStripeButton();
  confirmStripeSuccess();
})();
