(() => {
  "use strict";

  const products = window.GLOAMWEALD_PRODUCTS || [];
  const collections = window.GLOAMWEALD_COLLECTIONS || {};
  const CART_STORAGE_KEY = "gloamweald-cart";
  const CONTACT_EMAIL = "gloamweald@gmail.com";
  const PAYPAL_CLIENT_ID = "REPLACE_WITH_PAYPAL_CLIENT_ID";
  const PAYPAL_CURRENCY = "AUD";
  const PAYPAL_CREATE_ORDER_ENDPOINT = "/api/create-paypal-order";
  const PAYPAL_CAPTURE_ORDER_ENDPOINT = "/api/capture-paypal-order";
  const CHECKOUT_SUCCESS_URL = "success.html";

  const typeLabels = {
    bracelets: "Bracelet",
    necklaces: "Necklace",
    "wallet-chains": "Wallet chain",
    earrings: "Earrings",
    other: "Other",
  };

  const shippingRates = {
    pickup: {
      label: "Brisbane pickup / hand-off",
      amount: 0,
      countries: ["AU"],
      detail: "No shipping fee. Arrange the details by email.",
    },
    "au-standard": {
      label: "Australia standard tracked shipping",
      amount: 10,
      countries: ["AU"],
      detail: "Placeholder rate: $10 AUD.",
    },
    "au-express": {
      label: "Australia express tracked shipping",
      amount: 16,
      countries: ["AU"],
      detail: "Placeholder rate: $16 AUD.",
    },
    "international-quote": {
      label: "International shipping quote",
      amount: null,
      countries: ["INTL"],
      detail: "Shipping will be quoted before payment.",
    },
  };

  const money = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  });

  const paypalReady =
    PAYPAL_CLIENT_ID &&
    !PAYPAL_CLIENT_ID.includes("REPLACE_WITH") &&
    PAYPAL_CLIENT_ID.length > 12;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function moneyValue(amount) {
    return Number(amount || 0).toFixed(2);
  }

  function truncate(value, length = 127) {
    const text = String(value || "").trim();
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  }

  function productPrice(product) {
    const match = String(product.price || "").match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    return match ? Number(match[1]) : null;
  }

  function productById(id) {
    return products.find((product) => product.id === id);
  }

  function orderSubject(product) {
    return encodeURIComponent(`${product.name} enquiry`);
  }

  function mailtoForProduct(product) {
    return `mailto:${CONTACT_EMAIL}?subject=${orderSubject(product)}`;
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

  function writeCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
    renderCartPage();
  }

  function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartCount();
    renderCartPage();
  }

  function cartQuantity() {
    return readCart().reduce((total, item) => total + item.quantity, 0);
  }

  function cartLineItems() {
    return readCart()
      .map((item) => {
        const product = productById(item.id);
        const price = productPrice(product);
        return {
          ...item,
          product,
          price,
          lineTotal: price * item.quantity,
        };
      })
      .filter((item) => item.product && item.price !== null);
  }

  function cartSubtotal() {
    return cartLineItems().reduce((total, item) => total + item.lineTotal, 0);
  }

  function addToCart(productId) {
    const product = productById(productId);
    if (!product || productPrice(product) === null) return;

    const cart = readCart();
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }

    writeCart(cart);
    announceCart(`${product.name} added to cart.`);
  }

  function updateCartItem(productId, quantity) {
    const cart = readCart()
      .map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item,
      )
      .filter((item) => item.quantity > 0);
    writeCart(cart);
  }

  function removeCartItem(productId) {
    writeCart(readCart().filter((item) => item.id !== productId));
  }

  function installCartLink() {
    document.querySelectorAll(".site-header nav").forEach((nav) => {
      if (nav.querySelector("[data-cart-link]")) return;

      const link = document.createElement("a");
      link.href = "cart.html";
      link.className = "cart-nav-link";
      link.dataset.cartLink = "";
      link.innerHTML = `Cart <span class="cart-count" data-cart-count>0</span>`;

      if (location.pathname.endsWith("/cart.html") || location.pathname.endsWith("cart.html")) {
        link.setAttribute("aria-current", "page");
      }

      nav.append(link);
    });
  }

  function updateCartCount() {
    const count = cartQuantity();
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
      badge.setAttribute("aria-label", `${count} item${count === 1 ? "" : "s"} in cart`);
    });
  }

  function announceCart(message) {
    let announcer = document.querySelector("[data-cart-announcer]");
    if (!announcer) {
      announcer = document.createElement("p");
      announcer.className = "visually-hidden";
      announcer.dataset.cartAnnouncer = "";
      announcer.setAttribute("aria-live", "polite");
      document.body.append(announcer);
    }
    announcer.textContent = message;
  }

  function productMedia(product) {
    if (product.images?.length) {
      const images = product.images
        .map(
          (image, index) => `
            <button
              class="product-photo"
              type="button"
              data-lightbox-open="${escapeHtml(product.id)}"
              data-image-index="${index}"
              aria-label="Open image ${index + 1} of ${product.images.length} for ${escapeHtml(product.name)} full-screen"
            >
              <img
                src="${escapeHtml(image.src)}"
                alt="${escapeHtml(image.alt)}"
                ${index === 0 ? "" : 'loading="lazy"'}
              />
            </button>
          `,
        )
        .join("");
      const controls =
        product.images.length > 1
          ? `
            <button
              class="gallery-arrow gallery-arrow--previous"
              type="button"
              data-gallery-nav="-1"
              aria-label="Previous ${escapeHtml(product.name)} photograph"
              disabled
            ><span aria-hidden="true">&lsaquo;</span></button>
            <button
              class="gallery-arrow gallery-arrow--next"
              type="button"
              data-gallery-nav="1"
              aria-label="Next ${escapeHtml(product.name)} photograph"
            ><span aria-hidden="true">&rsaquo;</span></button>
          `
          : "";

      return `
        <div class="product-visual product-visual--photo">
          <div
            class="product-gallery"
            tabindex="0"
            data-product-gallery
            aria-label="${escapeHtml(product.name)} product photographs"
          >
            ${images}
          </div>
          ${controls}
        </div>
      `;
    }

    return `
      <div
        class="product-visual product-visual--${escapeHtml(product.visual)}"
        role="img"
        aria-label="Photography placeholder for ${escapeHtml(product.name)}"
      >
        <span>Photography coming soon</span>
        <i aria-hidden="true"></i>
      </div>
    `;
  }

  function productAction(product) {
    const price = productPrice(product);

    if (product.orderable && price !== null) {
      return `
        <div class="product-actions">
          <button
            class="button button--solid"
            type="button"
            data-add-to-cart="${escapeHtml(product.id)}"
          >Add to cart</button>
          <a class="quiet-button" href="${mailtoForProduct(product)}">Ask a question</a>
        </div>
      `;
    }

    if (product.orderable) {
      return `<a class="button" href="${mailtoForProduct(product)}">Enquire to order</a>`;
    }

    return `<span class="concept-label">Concept placeholder</span>`;
  }

  function productCard(product) {
    const componentTags = product.components
      .map((component) => `<span>${escapeHtml(component)}</span>`)
      .join("");
    const collection = product.collection ? collections[product.collection] : null;
    const collectionTag = collection
      ? `<a class="product-collection-link" href="${escapeHtml(collection.url)}">${escapeHtml(collection.name)}</a>`
      : "";

    return `
      <article
        class="product-card"
        data-product
        data-product-id="${escapeHtml(product.id)}"
        data-type="${escapeHtml(product.type)}"
        data-components="${escapeHtml(product.components.join(" "))}"
      >
        ${productMedia(product)}
        <div class="product-details">
          <div class="product-tags" aria-label="Product categories">
            <span>${escapeHtml(typeLabels[product.type] || product.type)}</span>
            ${componentTags}
            ${collectionTag}
          </div>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="price">${escapeHtml(product.price)}</p>
          <p>${escapeHtml(product.description)}</p>
          <dl class="product-specs">
            <div><dt>Material</dt><dd>${escapeHtml(product.material)}</dd></div>
            <div><dt>Status</dt><dd>${escapeHtml(product.status)}</dd></div>
          </dl>
          ${productAction(product)}
        </div>
      </article>
    `;
  }

  const grids = [...document.querySelectorAll("[data-product-grid]")];

  grids.forEach((grid) => {
    const collection = grid.dataset.collection;
    const visibleProducts = collection
      ? products.filter((product) => product.collection === collection)
      : products;

    grid.innerHTML = visibleProducts.map(productCard).join("");
  });

  function updateGalleryButtons(gallery) {
    const visual = gallery.closest(".product-visual");
    const previous = visual?.querySelector('[data-gallery-nav="-1"]');
    const next = visual?.querySelector('[data-gallery-nav="1"]');
    if (!previous || !next) return;

    const maximum = gallery.scrollWidth - gallery.clientWidth;
    previous.disabled = gallery.scrollLeft <= 2;
    next.disabled = gallery.scrollLeft >= maximum - 2;
  }

  document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
    gallery.addEventListener("scroll", () => updateGalleryButtons(gallery), {
      passive: true,
    });
    updateGalleryButtons(gallery);
  });

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog class="image-lightbox" id="image-lightbox" aria-labelledby="lightbox-title">
        <h2 class="visually-hidden" id="lightbox-title">Product photographs</h2>
        <button class="lightbox-close" type="button" data-lightbox-close>
          <span aria-hidden="true">&times;</span>
          <span class="visually-hidden">Close full-screen image viewer</span>
        </button>
        <div class="lightbox-stage">
          <button
            class="lightbox-arrow lightbox-arrow--previous"
            type="button"
            data-lightbox-nav="-1"
            aria-label="Previous photograph"
          ><span aria-hidden="true">&lsaquo;</span></button>
          <div
            class="lightbox-track"
            data-lightbox-track
            tabindex="0"
            aria-label="Full-screen product photographs"
          ></div>
          <button
            class="lightbox-arrow lightbox-arrow--next"
            type="button"
            data-lightbox-nav="1"
            aria-label="Next photograph"
          ><span aria-hidden="true">&rsaquo;</span></button>
        </div>
        <p class="lightbox-counter" data-lightbox-counter aria-live="polite"></p>
      </dialog>
    `,
  );

  const lightbox = document.querySelector("#image-lightbox");
  const lightboxTitle = document.querySelector("#lightbox-title");
  const lightboxTrack = document.querySelector("[data-lightbox-track]");
  const lightboxCounter = document.querySelector("[data-lightbox-counter]");
  const lightboxPrevious = document.querySelector('[data-lightbox-nav="-1"]');
  const lightboxNext = document.querySelector('[data-lightbox-nav="1"]');
  let activeLightboxImages = [];

  function lightboxIndex() {
    if (!lightboxTrack.clientWidth) return 0;
    return Math.round(lightboxTrack.scrollLeft / lightboxTrack.clientWidth);
  }

  function updateLightboxControls() {
    if (!activeLightboxImages.length) return;

    const index = lightboxIndex();
    const maximumIndex = activeLightboxImages.length - 1;
    lightboxPrevious.disabled = index <= 0;
    lightboxNext.disabled = index >= maximumIndex;
    lightboxPrevious.hidden = maximumIndex <= 0;
    lightboxNext.hidden = maximumIndex <= 0;
    lightboxCounter.textContent = `${index + 1} / ${activeLightboxImages.length}`;
  }

  function moveLightbox(direction) {
    lightboxTrack.scrollBy({
      left: direction * lightboxTrack.clientWidth,
      behavior: "smooth",
    });
  }

  function openLightbox(productId, imageIndex) {
    const product = productById(productId);
    if (!product?.images?.length) return;

    activeLightboxImages = product.images;
    lightboxTitle.textContent = `${product.name} photographs`;
    lightboxTrack.innerHTML = product.images
      .map(
        (image) => `
          <div class="lightbox-slide">
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" />
          </div>
        `,
      )
      .join("");

    document.documentElement.classList.add("lightbox-open");
    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
    } else {
      lightbox.setAttribute("open", "");
    }

    requestAnimationFrame(() => {
      lightboxTrack.scrollLeft = imageIndex * lightboxTrack.clientWidth;
      updateLightboxControls();
      lightbox.querySelector("[data-lightbox-close]").focus();
    });
  }

  function closeLightbox() {
    if (typeof lightbox.close === "function") {
      lightbox.close();
    } else {
      lightbox.removeAttribute("open");
    }
  }

  function shippingOptionsForCountry(country) {
    return country === "AU"
      ? ["pickup", "au-standard", "au-express"]
      : ["international-quote"];
  }

  function currentShippingRate() {
    const select = document.querySelector("[data-shipping-method]");
    return shippingRates[select?.value] || shippingRates["au-standard"];
  }

  function currentShippingId() {
    const select = document.querySelector("[data-shipping-method]");
    return select?.value || "au-standard";
  }

  function updatePickupRequirements() {
    const shipping = currentShippingRate();
    const pickup = shipping.amount === 0;
    const addressFields = ["address1", "city", "state", "postcode"];

    addressFields.forEach((name) => {
      const field = document.querySelector(`[name="${name}"]`);
      field?.toggleAttribute("required", !pickup);
    });

    document.querySelectorAll("[data-address-field]").forEach((label) => {
      label.classList.toggle("is-optional", pickup);
      const note = label.querySelector("[data-required-note]");
      if (note) note.textContent = pickup ? "optional for pickup" : "";
    });
  }

  function renderShippingOptions() {
    const country = document.querySelector("[data-checkout-country]");
    const shipping = document.querySelector("[data-shipping-method]");
    if (!country || !shipping) return;

    const previous = shipping.value;
    const options = shippingOptionsForCountry(country.value);
    shipping.innerHTML = options
      .map((key) => {
        const rate = shippingRates[key];
        const price = rate.amount === null ? "quote required" : money.format(rate.amount);
        return `<option value="${key}">${rate.label} — ${price}</option>`;
      })
      .join("");

    if (options.includes(previous)) {
      shipping.value = previous;
    }

    renderCartPage();
  }

  function renderCartPage() {
    const cartItems = document.querySelector("[data-cart-items]");
    const cartEmpty = document.querySelector("[data-cart-empty]");
    const subtotalNode = document.querySelector("[data-cart-subtotal]");
    const shippingNode = document.querySelector("[data-cart-shipping]");
    const totalNode = document.querySelector("[data-cart-total]");
    const checkoutForm = document.querySelector("[data-checkout-form]");
    const shippingNote = document.querySelector("[data-shipping-note]");

    if (!cartItems || !cartEmpty || !subtotalNode || !shippingNode || !totalNode) return;

    const items = cartLineItems();
    const subtotal = cartSubtotal();
    const shipping = currentShippingRate();
    const needsQuote = shipping.amount === null;

    cartEmpty.hidden = items.length !== 0;
    cartItems.hidden = items.length === 0;

    cartItems.innerHTML = items
      .map(
        (item) => `
          <article class="cart-line">
            <div>
              <h3>${escapeHtml(item.product.name)}</h3>
              <p>${money.format(item.price)} each</p>
            </div>
            <div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.product.name)}">
              <button type="button" data-cart-change="${escapeHtml(item.id)}" data-cart-delta="-1" aria-label="Remove one ${escapeHtml(item.product.name)}">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-change="${escapeHtml(item.id)}" data-cart-delta="1" aria-label="Add one ${escapeHtml(item.product.name)}">+</button>
            </div>
            <strong>${money.format(item.lineTotal)}</strong>
            <button class="quiet-button cart-remove" type="button" data-cart-remove="${escapeHtml(item.id)}">Remove</button>
          </article>
        `,
      )
      .join("");

    subtotalNode.textContent = money.format(subtotal);
    shippingNode.textContent = needsQuote ? "To be quoted" : money.format(shipping.amount);
    totalNode.textContent = needsQuote ? "Quote required" : money.format(subtotal + shipping.amount);

    if (shippingNote) {
      shippingNote.textContent = shipping.detail;
    }

    updatePickupRequirements();

    if (checkoutForm) {
      [...checkoutForm.elements].forEach((element) => {
        if (element.matches?.("button, input, select, textarea")) {
          element.disabled = items.length === 0;
        }
      });
    }

    updatePayPalStatus();
  }

  function checkoutLineSummary(items) {
    return items
      .map((item) => `${item.quantity} x ${item.product.name} — ${money.format(item.lineTotal)}`)
      .join("\n");
  }

  function checkoutAddressSummary(formData) {
    const locality = [
      formData.get("city"),
      formData.get("state"),
      formData.get("postcode"),
    ]
      .filter(Boolean)
      .join(" ");

    return [
      formData.get("name"),
      formData.get("email"),
      formData.get("phone"),
      formData.get("address1"),
      formData.get("address2"),
      locality,
      formData.get("country") === "AU" ? "Australia" : "International",
    ]
      .filter((line) => String(line || "").trim())
      .join("\n");
  }

  function currentCheckoutDetails(form) {
    const formData = new FormData(form);
    const shipping = currentShippingRate();
    const items = cartLineItems();
    const subtotal = cartSubtotal();
    const total = shipping.amount === null ? null : subtotal + shipping.amount;

    return {
      formData,
      items,
      shipping,
      subtotal,
      total,
      needsQuote: shipping.amount === null,
    };
  }

  function checkoutEmailText(details, paypalDetails = {}) {
    const { formData, items, shipping, subtotal, total } = details;

    return [
      "GLOAMWEALD order",
      "",
      paypalDetails.orderId ? `PayPal order ID: ${paypalDetails.orderId}` : null,
      paypalDetails.captureId ? `PayPal capture ID: ${paypalDetails.captureId}` : null,
      paypalDetails.status ? `PayPal status: ${paypalDetails.status}` : null,
      paypalDetails.payerEmail ? `PayPal payer email: ${paypalDetails.payerEmail}` : null,
      "",
      checkoutLineSummary(items),
      "",
      `Subtotal: ${money.format(subtotal)}`,
      `Shipping: ${shipping.amount === null ? "quote required" : money.format(shipping.amount)} (${shipping.label})`,
      `Total: ${total === null ? "quote required" : money.format(total)}`,
      "",
      "Delivery details",
      checkoutAddressSummary(formData),
      "",
      "Customer notes",
      formData.get("notes") || "None",
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  function checkoutMailto(details, paypalDetails = {}) {
    const subject = encodeURIComponent(
      paypalDetails.orderId
        ? `GLOAMWEALD PayPal order ${paypalDetails.orderId}`
        : "GLOAMWEALD order request",
    );
    const body = encodeURIComponent(checkoutEmailText(details, paypalDetails));
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  function checkoutPayload(details) {
    const { formData, items } = details;
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
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      shippingId: currentShippingId(),
      notes: String(formData.get("notes") || "").trim(),
    };
  }

  async function postCheckoutJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Checkout service is not ready. Please try again later.");
    }
    return data;
  }

  async function createBackendPayPalOrder(form) {
    const details = currentCheckoutDetails(form);
    if (!details.items.length || details.needsQuote) {
      throw new Error("This order cannot be paid by PayPal until the cart and shipping are ready.");
    }

    const data = await postCheckoutJson(PAYPAL_CREATE_ORDER_ENDPOINT, checkoutPayload(details));
    if (!data.id || !data.orderToken) {
      throw new Error("Checkout service did not return a PayPal order token.");
    }

    form.dataset.paypalOrderToken = data.orderToken;
    return data.id;
  }

  function redirectToSuccess(data = {}) {
    clearCart();
    const params = new URLSearchParams();
    if (data.orderID) params.set("order", data.orderID);
    if (data.captureID) params.set("capture", data.captureID);
    if (data.emailSent === false) params.set("email", "failed");
    if (data.warning) params.set("warning", data.warning);
    window.location.href = `${CHECKOUT_SUCCESS_URL}${params.toString() ? `?${params}` : ""}`;
  }

  function renderSuccessPage() {
    const panel = document.querySelector("[data-payment-success]");
    if (!panel) return;

    const params = new URLSearchParams(window.location.search);
    const order = params.get("order");
    const capture = params.get("capture");
    const emailFailed = params.get("email") === "failed";
    const warning = params.get("warning");
    const hero = document.querySelector(".page-hero--cart");
    const heroTitle = hero?.querySelector("h1");
    const heroCopy = hero?.querySelector("p:last-child");
    const panelEyebrow = panel.querySelector(".eyebrow");
    const panelTitle = panel.querySelector("#success-title");
    const message = panel.querySelector("[data-success-message]");
    const warningNode = panel.querySelector("[data-success-warning]");
    const details = panel.querySelector("[data-success-details]");
    const orderNode = panel.querySelector("[data-success-order]");
    const captureNode = panel.querySelector("[data-success-capture]");

    if (order && capture) {
      clearCart();
      if (heroTitle) heroTitle.textContent = "Payment confirmed";
      if (heroCopy) heroCopy.textContent = "Your PayPal payment has been captured by the secure checkout backend.";
      if (panelEyebrow) panelEyebrow.textContent = "Order received";
      if (panelTitle) panelTitle.textContent = "Thank you — your chainmail is in the making queue.";
      if (message) {
        message.textContent =
          "Your cart has been cleared. Keep your PayPal receipt for your records; Gloamweald has also received the order details.";
      }
      details.hidden = false;
      if (orderNode) orderNode.textContent = order;
      if (captureNode) captureNode.textContent = capture;

      if (warningNode && (emailFailed || warning)) {
        warningNode.hidden = false;
        warningNode.textContent =
          warning ||
          "Payment was captured, but the order email could not be sent. Please contact Gloamweald with your PayPal order ID.";
      }
      return;
    }

    if (details) details.hidden = true;
    if (warningNode) {
      warningNode.hidden = false;
      warningNode.textContent =
        "No confirmed backend PayPal capture was supplied. If you have just paid and this page looks wrong, contact Gloamweald before trying again.";
    }
  }

  function renderCheckoutResult(details, errorMessage = "") {
    const result = document.querySelector("[data-checkout-result]");
    if (!result) return;

    result.hidden = false;
    result.innerHTML = `
      <h3>${errorMessage ? "Checkout needs attention" : "Enquiry email ready"}</h3>
      <p>${errorMessage ? escapeHtml(errorMessage) : "This email is only for pre-payment enquiries or quoted shipping. Paid PayPal orders are emailed automatically by the backend after capture."}</p>
      <div class="checkout-result-actions">
        <a class="button button--solid" href="${checkoutMailto(details)}">Email enquiry details</a>
      </div>
    `;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const details = currentCheckoutDetails(form);
    if (!details.items.length) return;

    renderCheckoutResult(details);
  }

  function updatePayPalStatus() {
    const status = document.querySelector("[data-paypal-status]");
    const buttonContainer = document.querySelector("[data-paypal-buttons]");
    const checkoutForm = document.querySelector("[data-checkout-form]");
    if (!status || !buttonContainer || !checkoutForm) return;

    const details = currentCheckoutDetails(checkoutForm);
    buttonContainer.hidden = !paypalReady || details.needsQuote || details.items.length === 0;

    if (!details.items.length) {
      status.textContent = "Add something to the cart to activate PayPal checkout.";
      return;
    }

    if (details.needsQuote) {
      status.textContent =
        "International shipping needs a custom quote before PayPal payment can be taken. Use the enquiry email button for this order.";
      return;
    }

    if (!paypalReady) {
      status.innerHTML =
        "PayPal checkout is coded, but it stays disabled until your PayPal Client ID is added. The PayPal Client Secret must stay only in backend environment variables.";
      return;
    }

    status.textContent =
      "Use the PayPal button below. The backend creates and captures the order, then emails the order details to Gloamweald.";
  }

  function loadPayPalSdk() {
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
        "client-id": PAYPAL_CLIENT_ID,
        currency: PAYPAL_CURRENCY,
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
    if (!buttonContainer || !status || !checkoutForm || !paypalReady || buttonContainer.dataset.rendered) return;

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
        "PayPal checkout could not load. Check the PayPal client ID, then reload the page.";
    }
  }

  installCartLink();
  updateCartCount();
  renderShippingOptions();
  renderCartPage();
  renderSuccessPage();
  updatePayPalStatus();
  renderPayPalButtons();

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-to-cart]");
    if (addButton) {
      addToCart(addButton.dataset.addToCart);
      addButton.textContent = "Added";
      window.setTimeout(() => {
        addButton.textContent = "Add to cart";
      }, 1100);
      return;
    }

    const changeButton = event.target.closest("[data-cart-change]");
    if (changeButton) {
      const productId = changeButton.dataset.cartChange;
      const delta = Number(changeButton.dataset.cartDelta);
      const item = readCart().find((cartItem) => cartItem.id === productId);
      if (item) updateCartItem(productId, item.quantity + delta);
      return;
    }

    const removeButton = event.target.closest("[data-cart-remove]");
    if (removeButton) {
      removeCartItem(removeButton.dataset.cartRemove);
      return;
    }

    const galleryButton = event.target.closest("[data-gallery-nav]");
    if (galleryButton) {
      const gallery = galleryButton
        .closest(".product-visual")
        ?.querySelector("[data-product-gallery]");
      gallery?.scrollBy({
        left: Number(galleryButton.dataset.galleryNav) * gallery.clientWidth,
        behavior: "smooth",
      });
      return;
    }

    const imageButton = event.target.closest("[data-lightbox-open]");
    if (imageButton) {
      openLightbox(
        imageButton.dataset.lightboxOpen,
        Number(imageButton.dataset.imageIndex),
      );
      return;
    }

    const lightboxButton = event.target.closest("[data-lightbox-nav]");
    if (lightboxButton) {
      moveLightbox(Number(lightboxButton.dataset.lightboxNav));
      return;
    }

    if (event.target.closest("[data-lightbox-close]")) {
      closeLightbox();
    }
  });

  document.querySelector("[data-checkout-country]")?.addEventListener("change", renderShippingOptions);
  document.querySelector("[data-shipping-method]")?.addEventListener("change", renderCartPage);
  document.querySelector("[data-checkout-form]")?.addEventListener("submit", handleCheckoutSubmit);

  lightboxTrack.addEventListener("scroll", updateLightboxControls, {
    passive: true,
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightbox.addEventListener("close", () => {
    document.documentElement.classList.remove("lightbox-open");
    activeLightboxImages = [];
    lightboxTrack.innerHTML = "";
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveLightbox(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveLightbox(1);
    }
  });

  const filterButtons = [...document.querySelectorAll("[data-filter-group]")];
  const shopProducts = [...document.querySelectorAll("[data-shop-grid] [data-product]")];
  const status = document.querySelector("#filter-status");
  const clearButton = document.querySelector("#clear-filters");
  const emptyState = document.querySelector("#empty-state");

  if (!filterButtons.length || !shopProducts.length) return;

  const selected = {
    type: "all",
    component: "all",
  };

  function setPressedState(group, value) {
    filterButtons
      .filter((button) => button.dataset.filterGroup === group)
      .forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.filterValue === value));
      });
  }

  function updateProducts() {
    let visibleCount = 0;

    shopProducts.forEach((product) => {
      const components = product.dataset.components.split(/\s+/).filter(Boolean);
      const matchesType =
        selected.type === "all" || product.dataset.type === selected.type;
      const matchesComponent =
        selected.component === "all" || components.includes(selected.component);
      const isVisible = matchesType && matchesComponent;

      product.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    const filtersAreClear =
      selected.type === "all" && selected.component === "all";

    clearButton.hidden = filtersAreClear;
    emptyState.hidden = visibleCount !== 0;
    status.textContent = filtersAreClear
      ? `Showing all ${shopProducts.length} pieces.`
      : visibleCount === 0
        ? "No pieces match these filters yet."
        : `Showing ${visibleCount} of ${shopProducts.length} pieces.`;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const { filterGroup, filterValue } = button.dataset;
      selected[filterGroup] = filterValue;
      setPressedState(filterGroup, filterValue);
      updateProducts();
    });
  });

  clearButton.addEventListener("click", () => {
    selected.type = "all";
    selected.component = "all";
    setPressedState("type", "all");
    setPressedState("component", "all");
    updateProducts();
  });

  updateProducts();
})();
