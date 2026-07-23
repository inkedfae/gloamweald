(() => {
  "use strict";

  const cart = window.GloamwealdCart;
  if (!cart) return;

  const {
    cartLineItems,
    cartSubtotal,
    clearCart,
    CONTACT_EMAIL,
    escapeHtml,
    money,
    moneyValue,
  } = cart;

  const PAYPAL_CONFIG_ENDPOINT = "/api/checkout-config";
  const PAYPAL_CURRENCY = "AUD";
  const PAYPAL_CREATE_ORDER_ENDPOINT = "/api/create-paypal-order";
  const PAYPAL_CAPTURE_ORDER_ENDPOINT = "/api/capture-paypal-order";
  const STRIPE_CREATE_SESSION_ENDPOINT = "/api/create-stripe-session";
  const STRIPE_CONFIRM_SESSION_ENDPOINT = "/api/confirm-stripe-session";
  const CHECKOUT_SUCCESS_URL = "success.html";
  const FREE_STANDARD_SHIPPING_THRESHOLD = 150;

  let checkoutConfig = {
    configured: false,
    loaded: false,
    paypalConfigured: false,
    paypalClientId: "",
    currency: PAYPAL_CURRENCY,
    paypalEnv: "sandbox",
    stripeConfigured: false,
    stripeError: "",
    error: "",
  };
  let checkoutConfigPromise = null;

  const shippingRates = {
    "au-standard": {
      label: "Australia Post standard tracked shipping",
      countries: ["AU"],
      amount(subtotal) {
        return subtotal >= FREE_STANDARD_SHIPPING_THRESHOLD ? 0 : 10.95;
      },
      detail: "Standard tracked shipping is free on Australian orders of $150 or more.",
    },
    "au-express": {
      label: "Australia Post express tracked shipping",
      countries: ["AU"],
      amount(subtotal) {
        return subtotal >= FREE_STANDARD_SHIPPING_THRESHOLD ? 3 : 13.95;
      },
      detail: "Express tracked shipping is $13.95, or a $3 upgrade on Australian orders of $150 or more.",
    },
    "international-quote": {
      label: "International shipping quote",
      countries: ["INTL"],
      amount() {
        return null;
      },
      detail: "International shipping needs a custom quote before payment. Contact Gloamweald before ordering.",
    },
  };

  function paypalReady() {
    return Boolean(checkoutConfig.loaded && checkoutConfig.paypalConfigured && checkoutConfig.paypalClientId);
  }

  function stripeReady() {
    return Boolean(checkoutConfig.loaded && checkoutConfig.stripeConfigured);
  }

  function shippingOptionsForCountry(country) {
    return country === "AU"
      ? ["au-standard", "au-express"]
      : ["international-quote"];
  }

  function currentShippingId() {
    const select = document.querySelector("[data-shipping-method]");
    const country = document.querySelector("[data-checkout-country]")?.value || "AU";
    const options = shippingOptionsForCountry(country);
    return options.includes(select?.value) ? select.value : options[0];
  }

  function currentShippingRate() {
    return shippingRates[currentShippingId()] || shippingRates["au-standard"];
  }

  function currentShippingAmount(subtotal = cartSubtotal()) {
    const shipping = currentShippingRate();
    return typeof shipping.amount === "function" ? shipping.amount(subtotal) : shipping.amount;
  }

  function updateAddressRequirements() {
    const country = document.querySelector("[data-checkout-country]")?.value || "AU";
    const requiresAddress = country === "AU";
    const addressFields = ["address1", "city", "state", "postcode"];

    addressFields.forEach((name) => {
      const field = document.querySelector(`[name="${name}"]`);
      field?.toggleAttribute("required", requiresAddress);
    });

    document.querySelectorAll("[data-address-field]").forEach((label) => {
      label.classList.toggle("is-optional", !requiresAddress);
      const note = label.querySelector("[data-required-note]");
      if (note) note.textContent = requiresAddress ? "" : "optional for quote";
    });
  }

  function renderShippingOptions({ refreshCart = true } = {}) {
    const country = document.querySelector("[data-checkout-country]");
    const shipping = document.querySelector("[data-shipping-method]");
    if (!country || !shipping) return;

    const previous = shipping.value;
    const subtotal = cartSubtotal();
    const options = shippingOptionsForCountry(country.value);
    shipping.innerHTML = options
      .map((key) => {
        const rate = shippingRates[key];
        const amount = typeof rate.amount === "function" ? rate.amount(subtotal) : rate.amount;
        const price = amount === null ? "quote required" : money.format(amount);
        return `<option value="${key}">${rate.label} - ${price}</option>`;
      })
      .join("");

    shipping.value = options.includes(previous) ? previous : options[0];
    updateAddressRequirements();
    if (refreshCart) renderCartPage();
  }

  function priceDeltaLabel(amount) {
    const value = Number(amount || 0);
    if (!value) return "Included";
    return `+${money.format(value)}`;
  }

  function cartProductUrl(item) {
    const slug = item.product?.slug || item.product?.id || item.productId || "";
    if (!slug) return "shop.html";

    const params = new URLSearchParams();
    params.set("product", slug);
    params.set("editCart", item.key || item.id || "");
    params.set("quantity", String(item.quantity || 1));

    const selections = item.selections || {};
    if (selections.length?.value) params.set("length", String(selections.length.value));
    if (selections.clasp?.id) params.set("clasp", selections.clasp.id);
    if (selections.extender) {
      params.set("extender", selections.extender.selected ? "yes" : "no");
    }

    return `product.html?${params.toString()}`;
  }

  function cartModifierCostRows(item) {
    const selections = item.selections || {};
    const rows = [];

    if (selections.length?.label) {
      rows.push({
        label: `Length: ${selections.length.label}`,
        price: priceDeltaLabel(selections.length.priceDelta),
      });
    }

    if (selections.clasp?.label) {
      rows.push({
        label: `Clasp: ${selections.clasp.label}`,
        price: priceDeltaLabel(selections.clasp.priceDelta),
      });
    }

    if (selections.extender?.selected) {
      rows.push({
        label: `Extender: ${selections.extender.label}`,
        price: priceDeltaLabel(selections.extender.priceDelta),
      });
    }

    if (!rows.length) return "";

    const basePrice = Number.isFinite(item.basePrice) ? money.format(item.basePrice) : money.format(item.price);
    const unitPrice = Number.isFinite(item.finalUnitPrice) ? money.format(item.finalUnitPrice) : money.format(item.price);

    return `
      <dl class="cart-line-costs" aria-label="Price details for ${escapeHtml(item.productName || item.product.name)}">
        <div><dt>Base piece</dt><dd>${basePrice}</dd></div>
        ${rows
          .map(
            (row) => `
              <div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.price)}</dd></div>
            `,
          )
          .join("")}
        <div class="cart-line-costs__total"><dt>Item price</dt><dd>${unitPrice}</dd></div>
      </dl>
    `;
  }

  function renderCartPage() {
    const cartItems = document.querySelector("[data-cart-items]");
    const cartEmpty = document.querySelector("[data-cart-empty]");
    const subtotalNode = document.querySelector("[data-cart-subtotal]");
    const shippingNode = document.querySelector("[data-cart-shipping]");
    const totalNode = document.querySelector("[data-cart-total]");
    const shippingNote = document.querySelector("[data-shipping-note]");

    if (!cartItems || !cartEmpty || !subtotalNode || !shippingNode || !totalNode) return;

    const items = cartLineItems();
    const subtotal = cartSubtotal();
    renderShippingOptions({ refreshCart: false });
    const shipping = currentShippingRate();
    const shippingAmount = currentShippingAmount(subtotal);
    const needsQuote = shippingAmount === null;

    cartEmpty.hidden = items.length !== 0;
    cartItems.hidden = items.length === 0;

    cartItems.innerHTML = items
      .map(
        (item) => `
          <article class="cart-line">
            <div>
              <h3>${escapeHtml(item.productName || item.product.name)}</h3>
              ${item.lineSummary ? `<p class="cart-line-options">${escapeHtml(item.lineSummary)}</p>` : ""}
              ${cartModifierCostRows(item)}
              <p>${money.format(item.price)} each</p>
            </div>
            <div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.productName || item.product.name)}">
              <button type="button" data-cart-change="${escapeHtml(item.key || item.id)}" data-cart-delta="-1" aria-label="Remove one ${escapeHtml(item.productName || item.product.name)}">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-change="${escapeHtml(item.key || item.id)}" data-cart-delta="1" aria-label="Add one ${escapeHtml(item.productName || item.product.name)}">+</button>
            </div>
            <strong>${money.format(item.lineTotal)}</strong>
            <div class="cart-line-actions">
              <a class="quiet-button" href="${escapeHtml(cartProductUrl(item))}" data-product-link>Adjust</a>
              <button class="quiet-button" type="button" data-cart-remove="${escapeHtml(item.key || item.id)}">Remove</button>
            </div>
          </article>
        `,
      )
      .join("");

    subtotalNode.textContent = money.format(subtotal);
    shippingNode.textContent = needsQuote ? "Quote required" : money.format(shippingAmount);
    totalNode.textContent = needsQuote ? "Quote required" : money.format(subtotal + shippingAmount);

    if (shippingNote) {
      shippingNote.textContent = needsQuote
        ? shipping.detail
        : `${shipping.detail} Your shipping charge is confirmed again at secure checkout.`;
    }

    updatePayPalStatus();
    updateStripeStatus();
  }

  window.GloamwealdCheckout = {
    renderCartPage,
  };

  function checkoutLineSummary(items) {
    return items
      .map((item) => {
        const summary = item.lineSummary ? ` (${item.lineSummary})` : "";
        return `${item.quantity} x ${item.productName || item.product.name}${summary} - ${money.format(item.lineTotal)}`;
      })
      .join("\n");
  }

  function checkoutAddressSummary(formData) {
    const parts = [
      formData.get("address1"),
      formData.get("address2"),
      formData.get("city"),
      formData.get("state"),
      formData.get("postcode"),
      formData.get("country"),
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean);

    return parts.length ? parts.join(", ") : "No postal address supplied.";
  }

  function checkoutMailto(details) {
    const lines = [
      "Gloamweald checkout enquiry",
      "",
      `Name: ${details.customer.name}`,
      `Email: ${details.customer.email}`,
      `Phone: ${details.customer.phone || "Not supplied"}`,
      "",
      "Items:",
      checkoutLineSummary(details.displayItems),
      "",
      `Subtotal: ${money.format(details.subtotal)}`,
      `Shipping: ${details.shippingAmount === null ? "Quote required" : money.format(details.shippingAmount)} (${details.shippingLabel})`,
      `Total: ${details.shippingAmount === null ? "Quote required" : money.format(details.total)}`,
      "",
      `Address: ${details.addressSummary}`,
      "",
      `Notes: ${details.notes || "No notes provided."}`,
    ];

    const subject = encodeURIComponent("Gloamweald checkout enquiry");
    const body = encodeURIComponent(lines.join("\n"));
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  function currentCheckoutDetails(form = document.querySelector("[data-checkout-form]")) {
    const formData = new FormData(form);
    const displayItems = cartLineItems();
    const subtotal = cartSubtotal();
    const shippingId = currentShippingId();
    const shipping = currentShippingRate();
    const shippingAmount = currentShippingAmount(subtotal);
    const total = shippingAmount === null ? subtotal : subtotal + shippingAmount;

    const customer = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address1: String(formData.get("address1") || "").trim(),
      address2: String(formData.get("address2") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      postcode: String(formData.get("postcode") || "").trim(),
      country: String(formData.get("country") || "AU").trim() || "AU",
    };

    return {
      items: displayItems.map((item) => ({
        id: item.productId || item.product?.id || item.id,
        productId: item.productId || item.product?.id || item.id,
        quantity: item.quantity,
        selections: item.selections || {},
      })),
      displayItems,
      customer,
      shippingId,
      shippingLabel: shipping.label,
      shippingAmount,
      subtotal,
      total,
      addressSummary: checkoutAddressSummary(formData),
      notes: String(formData.get("notes") || "").trim(),
      needsQuote: shippingAmount === null || customer.country !== "AU",
    };
  }

  async function postCheckoutJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Checkout request failed.");
    }
    return data;
  }

  async function createBackendPayPalOrder(form) {
    const details = currentCheckoutDetails(form);
    const data = await postCheckoutJson(PAYPAL_CREATE_ORDER_ENDPOINT, {
      items: details.items,
      customer: details.customer,
      shippingId: details.shippingId,
      notes: details.notes,
    });

    form.dataset.paypalOrderToken = data.orderToken || "";
    return data.id;
  }

  async function createBackendStripeSession(form) {
    const details = currentCheckoutDetails(form);
    return postCheckoutJson(STRIPE_CREATE_SESSION_ENDPOINT, {
      items: details.items,
      customer: details.customer,
      shippingId: details.shippingId,
      notes: details.notes,
    });
  }

  function redirectToSuccess(result) {
    const params = new URLSearchParams({
      provider: "paypal",
      orderID: result.orderID || "",
      captureID: result.captureID || "",
    });
    if (result.warning) params.set("warning", result.warning);
    if (result.emailSent === false) params.set("emailFailed", "1");
    window.location.assign(`${CHECKOUT_SUCCESS_URL}?${params.toString()}`);
  }

  async function confirmStripeStatus(sessionId) {
    const response = await fetch(
      `${STRIPE_CONFIRM_SESSION_ENDPOINT}?${new URLSearchParams({ session_id: sessionId })}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, ...data };
  }

  async function handleStripeCheckout() {
    const form = document.querySelector("[data-checkout-form]");
    const status = document.querySelector("[data-stripe-status]");
    if (!form) return;

    const details = currentCheckoutDetails(form);
    if (!form.reportValidity() || !details.items.length || details.needsQuote) {
      updateStripeStatus();
      renderCheckoutResult(details, "This order needs attention before Stripe checkout can start.");
      return;
    }

    if (!stripeReady()) {
      updateStripeStatus();
      return;
    }

    try {
      if (status) status.textContent = "Creating secure Stripe checkout...";
      const session = await createBackendStripeSession(form);
      if (!session.url) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(session.url);
    } catch (error) {
      if (status) status.textContent = error.message;
      renderCheckoutResult(details, error.message);
    }
  }

  function renderSuccessDetails({ orderLabel, captureLabel, order, capture }) {
    const details = document.querySelector("[data-success-details]");
    const orderNode = document.querySelector("[data-success-order]");
    const captureNode = document.querySelector("[data-success-capture]");
    const orderLabelNode = document.querySelector("[data-success-order-label]");
    const captureLabelNode = document.querySelector("[data-success-capture-label]");

    if (orderLabelNode) orderLabelNode.textContent = orderLabel;
    if (captureLabelNode) captureLabelNode.textContent = captureLabel;
    if (orderNode) orderNode.textContent = order;
    if (captureNode) captureNode.textContent = capture;
    if (details) details.hidden = false;
  }

  function setSuccessState({ eyebrow, title, message, warning = "", showWarning = false }) {
    const panelEyebrow = document.querySelector("[data-success-eyebrow]");
    const panelTitle = document.querySelector("[data-success-title]");
    const panelMessage = document.querySelector("[data-success-message]");
    const warningNode = document.querySelector("[data-success-warning]");

    if (panelEyebrow) panelEyebrow.textContent = eyebrow;
    if (panelTitle) panelTitle.textContent = title;
    if (panelMessage) panelMessage.textContent = message;
    if (warningNode) {
      warningNode.hidden = !showWarning;
      warningNode.textContent = warning;
    }
  }

  async function renderSuccessPage() {
    if (!document.querySelector("[data-payment-success]")) return;

    const params = new URLSearchParams(window.location.search);
    const provider = params.get("provider");
    const stripeSessionId = params.get("session_id") || params.get("sessionID") || "";
    const paypalOrder = params.get("orderID") || "";
    const paypalCapture = params.get("captureID") || "";
    const emailFailed = params.get("emailFailed") === "1";
    const warning = params.get("warning") || "";

    if (provider === "stripe" && stripeSessionId) {
      setSuccessState({
        eyebrow: "Checking payment",
        title: "Checking Stripe payment confirmation.",
        message: "Please wait while Gloamweald checks Stripe's payment status. Your cart has not been cleared yet.",
      });

      try {
        const stripe = await confirmStripeStatus(stripeSessionId);
        if (!stripe.ok || !stripe.paid) {
          const details = document.querySelector("[data-success-details]");
          if (details) details.hidden = true;
          setSuccessState({
            eyebrow: "Awaiting confirmation",
            title: "Awaiting payment confirmation.",
            message:
              "Your cart has not been cleared. Keep your Stripe receipt and contact Gloamweald if this does not update or if you need help matching the payment to your order.",
            warning: `Stripe session ${stripe.sessionID || stripeSessionId} is not confirmed as paid yet.`,
            showWarning: true,
          });
          return;
        }

        clearCart();
        setSuccessState({
          eyebrow: "Payment confirmed",
          title: "Stripe payment confirmed.",
          message:
            "Your cart has been cleared. Keep your Stripe receipt for your records and check your email for your order confirmation.",
        });
        renderSuccessDetails({
          orderLabel: "Stripe session",
          captureLabel: "Payment intent",
          order: stripe.sessionID || stripeSessionId,
          capture: stripe.paymentIntent || "Confirmed by Stripe",
        });
      } catch (error) {
        const details = document.querySelector("[data-success-details]");
        if (details) details.hidden = true;
        setSuccessState({
          eyebrow: "Confirmation warning",
          title: "Stripe payment could not be confirmed.",
          message:
            "Your cart has not been cleared. Please keep your Stripe receipt and contact Gloamweald before trying payment again.",
          warning: error.message,
          showWarning: true,
        });
      }
      return;
    }

    if (provider === "paypal" && paypalOrder && paypalCapture) {
      clearCart();
      setSuccessState({
        eyebrow: "Order received",
        title: "Thank you - your chainmail is in the making queue.",
        message:
          "Your cart has been cleared. Keep your PayPal receipt for your records and check your email for your order confirmation.",
        warning:
          warning ||
          "Payment was captured, but the order email could not be sent. Please contact Gloamweald with your PayPal order ID.",
        showWarning: Boolean(emailFailed || warning),
      });
      renderSuccessDetails({
        orderLabel: "PayPal order",
        captureLabel: "Capture",
        order: paypalOrder,
        capture: paypalCapture,
      });
      return;
    }

    const details = document.querySelector("[data-success-details]");
    if (details) details.hidden = true;
    setSuccessState({
      eyebrow: "No confirmed payment",
      title: "No confirmed payment is shown yet.",
      message:
        "If you have just paid and this page looks wrong, contact Gloamweald before trying again.",
      warning:
        "No confirmed payment was supplied. If you have a payment receipt, keep it for your records.",
      showWarning: true,
    });
  }

  function renderCheckoutResult(details, errorMessage = "") {
    const result = document.querySelector("[data-checkout-result]");
    if (!result) return;

    result.hidden = false;
    result.innerHTML = `
      <h3>${errorMessage ? "Checkout needs attention" : "Enquiry email ready"}</h3>
      <p>${errorMessage ? escapeHtml(errorMessage) : "This email is only for pre-payment enquiries or quoted shipping. Paid PayPal and Stripe orders receive order confirmation by email after payment."}</p>
      <div class="checkout-result-actions">
        <a class="button button--solid" href="${checkoutMailto(details)}">Email enquiry details</a>
      </div>
    `;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();
    const details = currentCheckoutDetails(event.currentTarget);
    if (!details.items.length) return;
    renderCheckoutResult(details);
  }

  async function loadCheckoutConfig() {
    if (checkoutConfigPromise) return checkoutConfigPromise;

    checkoutConfigPromise = fetch(PAYPAL_CONFIG_ENDPOINT, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        checkoutConfig = {
          configured: Boolean(response.ok && data.configured !== false && data.paypalClientId),
          loaded: true,
          paypalConfigured: Boolean(response.ok && (data.paypalConfigured ?? data.configured) && data.paypalClientId),
          paypalClientId: String(data.paypalClientId || "").trim(),
          currency: String(data.currency || PAYPAL_CURRENCY).trim() || PAYPAL_CURRENCY,
          paypalEnv: String(data.paypalEnv || "sandbox").trim() || "sandbox",
          stripeConfigured: Boolean(data.stripeConfigured),
          stripeError: String(data.stripeError || "").trim(),
          error: data.error || "PayPal checkout is temporarily unavailable. Please try again later or contact Gloamweald.",
        };
        return checkoutConfig;
      })
      .catch(() => {
        checkoutConfig = {
          ...checkoutConfig,
          loaded: true,
          paypalConfigured: false,
          stripeConfigured: false,
          stripeError: "Card checkout is temporarily unavailable. Please try again later or contact Gloamweald.",
          error: "PayPal checkout is temporarily unavailable. Please try again later or contact Gloamweald.",
        };
        return checkoutConfig;
      });

    return checkoutConfigPromise;
  }

  function updatePayPalStatus() {
    const status = document.querySelector("[data-paypal-status]");
    const buttonContainer = document.querySelector("[data-paypal-buttons]");
    const checkoutForm = document.querySelector("[data-checkout-form]");
    if (!status || !buttonContainer || !checkoutForm) return;

    const details = currentCheckoutDetails(checkoutForm);
    buttonContainer.hidden = !paypalReady() || details.needsQuote || details.items.length === 0;

    if (!details.items.length) {
      status.textContent = "Add something to the cart to activate PayPal checkout.";
      return;
    }

    if (details.needsQuote) {
      status.textContent =
        "International shipping needs a custom quote before PayPal payment can be taken. Use the enquiry email button for this order.";
      return;
    }

    if (!checkoutConfig.loaded) {
      status.textContent = "Checking PayPal checkout...";
      return;
    }

    if (!paypalReady()) {
      status.textContent =
        checkoutConfig.error ||
        "PayPal checkout is temporarily unavailable. Please try again later or contact Gloamweald.";
      return;
    }

    status.textContent =
      "Use the PayPal button below. Your order confirmation will be emailed after payment is complete.";
  }

  function updateStripeStatus() {
    const status = document.querySelector("[data-stripe-status]");
    const button = document.querySelector("[data-stripe-checkout-button]");
    const checkoutForm = document.querySelector("[data-checkout-form]");
    if (!status || !button || !checkoutForm) return;

    const details = currentCheckoutDetails(checkoutForm);
    button.hidden = !stripeReady() || details.needsQuote || details.items.length === 0;
    button.disabled = !stripeReady() || details.needsQuote || details.items.length === 0;

    if (!details.items.length) {
      status.textContent = "Add something to the cart to activate Stripe checkout.";
      return;
    }

    if (details.needsQuote) {
      status.textContent =
        "International shipping needs a custom quote before Stripe payment can be taken. Use the enquiry email button for this order.";
      return;
    }

    if (!checkoutConfig.loaded) {
      status.textContent = "Checking card checkout...";
      return;
    }

    if (!stripeReady()) {
      status.textContent =
        checkoutConfig.stripeError ||
        "Card checkout is temporarily unavailable. Please try again later or contact Gloamweald.";
      return;
    }

    status.textContent =
      "Use Stripe for secure card payment. Your cart will clear after payment is confirmed.";
  }

  function loadPayPalSdk() {
    if (!paypalReady()) {
      return Promise.reject(new Error("PayPal checkout is not configured."));
    }

    if (window.paypal?.Buttons) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existing = document.querySelector("[data-paypal-sdk]");
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      const params = new URLSearchParams({
        "client-id": checkoutConfig.paypalClientId,
        currency: checkoutConfig.currency || PAYPAL_CURRENCY,
        intent: "capture",
        components: "buttons",
        "disable-funding": "card,credit,paylater,venmo",
      });

      script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
      script.dataset.paypalSdk = "";
      script.async = true;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  }

  async function renderPayPalButtons() {
    const buttonContainer = document.querySelector("[data-paypal-buttons]");
    const status = document.querySelector("[data-paypal-status]");
    const checkoutForm = document.querySelector("[data-checkout-form]");
    if (!buttonContainer || !status || !checkoutForm || !paypalReady() || buttonContainer.dataset.rendered) return;

    try {
      await loadPayPalSdk();
      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "silver",
            shape: "rect",
            label: "paypal",
          },
          onClick(_data, actions) {
            const details = currentCheckoutDetails(checkoutForm);

            if (!checkoutForm.reportValidity() || !details.items.length || details.needsQuote) {
              updatePayPalStatus();
              return actions.reject();
            }

            return actions.resolve();
          },
          createOrder() {
            return createBackendPayPalOrder(checkoutForm);
          },
          async onApprove(data, actions) {
            try {
              const capture = await postCheckoutJson(PAYPAL_CAPTURE_ORDER_ENDPOINT, {
                orderID: data.orderID,
                orderToken: checkoutForm.dataset.paypalOrderToken || "",
              });
              redirectToSuccess(capture);
            } catch (error) {
              if (error.message.includes("INSTRUMENT_DECLINED") && actions?.restart) {
                return actions.restart();
              }
              renderCheckoutResult(currentCheckoutDetails(checkoutForm), error.message);
            }
          },
          onCancel() {
            status.textContent = "PayPal checkout was cancelled. Your cart is still here.";
          },
          onError(error) {
            console.error("PayPal checkout error", error);
            status.textContent =
              "PayPal could not complete checkout. Please try again or use the backup email button.";
          },
        })
        .render(buttonContainer);

      buttonContainer.dataset.rendered = "true";
    } catch (error) {
      console.error("PayPal SDK failed to load", error);
      status.textContent =
        "PayPal checkout could not load. Please try again later or contact Gloamweald.";
    }
  }

  async function initialiseCheckout() {
    renderCartPage();
    renderSuccessPage();
    updatePayPalStatus();
    updateStripeStatus();
    await loadCheckoutConfig();
    updatePayPalStatus();
    updateStripeStatus();
    renderPayPalButtons();
  }

  document.querySelector("[data-checkout-country]")?.addEventListener("change", renderShippingOptions);
  document.querySelector("[data-shipping-method]")?.addEventListener("change", renderCartPage);
  document.querySelector("[data-checkout-form]")?.addEventListener("submit", handleCheckoutSubmit);
  document.querySelector("[data-stripe-checkout-button]")?.addEventListener("click", handleStripeCheckout);

  initialiseCheckout();
})();
