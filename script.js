(() => {
  "use strict";

  const products = window.GLOAMWEALD_PRODUCTS || [];
  const collections = window.GLOAMWEALD_COLLECTIONS || {};
  const CART_STORAGE_KEY = "gloamweald-cart";
  const CONTACT_EMAIL = "gloamweald@gmail.com";
  const PAYPAL_PLACEHOLDER_URL = "#paypal-link-placeholder";
  const CARD_PLACEHOLDER_LABEL = "Secure card checkout placeholder";

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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
        .filter((item) => productById(item.id) && productPrice(productById(item.id)) !== null);
    } catch {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
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

    if (checkoutForm) {
      [...checkoutForm.elements].forEach((element) => {
        if (element.matches?.("button, input, select, textarea")) {
          element.disabled = items.length === 0;
        }
      });
    }
  }

  function checkoutLineSummary(items) {
    return items
      .map((item) => `${item.quantity} x ${item.product.name} — ${money.format(item.lineTotal)}`)
      .join("\n");
  }

  function checkoutAddressSummary(formData) {
    return [
      formData.get("name"),
      formData.get("email"),
      formData.get("phone"),
      formData.get("address1"),
      formData.get("address2"),
      `${formData.get("city")} ${formData.get("state")} ${formData.get("postcode")}`,
      formData.get("country") === "AU" ? "Australia" : "International",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const result = document.querySelector("[data-checkout-result]");
    const items = cartLineItems();
    if (!items.length || !result) return;

    const formData = new FormData(form);
    const shipping = currentShippingRate();
    const subtotal = cartSubtotal();
    const total = shipping.amount === null ? null : subtotal + shipping.amount;
    const paymentMethod = formData.get("payment") === "card" ? "Card" : "PayPal";
    const subject = encodeURIComponent("GLOAMWEALD order request");
    const body = encodeURIComponent(
      [
        "Order request",
        "",
        checkoutLineSummary(items),
        "",
        `Subtotal: ${money.format(subtotal)}`,
        `Shipping: ${shipping.amount === null ? "quote required" : money.format(shipping.amount)} (${shipping.label})`,
        `Total: ${total === null ? "quote required" : money.format(total)}`,
        `Preferred payment: ${paymentMethod}`,
        "",
        "Delivery details",
        checkoutAddressSummary(formData),
        "",
        "Notes",
        formData.get("notes") || "None",
      ].join("\n"),
    );

    result.hidden = false;
    result.innerHTML = `
      <h3>Order request ready</h3>
      <p>This static checkout has gathered the cart, address and shipping details. The next step is to send the order request, then replace the payment placeholders with your real PayPal/card checkout links when they are ready.</p>
      <div class="checkout-result-actions">
        <a class="button button--solid" href="mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}">Send order by email</a>
        <a class="button" href="${PAYPAL_PLACEHOLDER_URL}">PayPal placeholder</a>
        <button class="button" type="button" disabled>${CARD_PLACEHOLDER_LABEL}</button>
      </div>
    `;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  installCartLink();
  updateCartCount();
  renderShippingOptions();
  renderCartPage();

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
