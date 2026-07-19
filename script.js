(() => {
  "use strict";

  const products = window.GLOAMWEALD_PRODUCTS || [];
  const collections = window.GLOAMWEALD_COLLECTIONS || {};
  const CART_STORAGE_KEY = "gloamweald-cart";
  const CONTACT_EMAIL = "gloamweald@gmail.com";

  const typeLabels = {
    bracelets: "Bracelet",
    necklaces: "Necklace",
    "wallet-chains": "Wallet chain",
    earrings: "Earrings",
    other: "Other",
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

  function moneyValue(amount) {
    return Number(amount || 0).toFixed(2);
  }

  function productPrice(product) {
    const match = String(product?.price || "").match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
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

  function updateCartCount() {
    const count = readCart().reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
      badge.setAttribute("aria-label", `${count} item${count === 1 ? "" : "s"} in cart`);
    });
  }

  function refreshCartUi() {
    updateCartCount();
    window.GloamwealdCheckout?.renderCartPage?.();
  }

  function writeCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    refreshCartUi();
  }

  function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    refreshCartUi();
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
      link.innerHTML = 'Cart <span class="cart-count" data-cart-count>0</span>';

      if (location.pathname.endsWith("/cart.html") || location.pathname.endsWith("cart.html")) {
        link.setAttribute("aria-current", "page");
      }

      nav.append(link);
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
            <div><dt>Clasp</dt><dd>${escapeHtml(product.clasp)}</dd></div>
            <div><dt>Status</dt><dd>${escapeHtml(product.status)}</dd></div>
          </dl>
          ${productAction(product)}
        </div>
      </article>
    `;
  }

  function renderProductGrids() {
    document.querySelectorAll("[data-product-grid]").forEach((grid) => {
      const collection = grid.dataset.collection;
      const visibleProducts = collection
        ? products.filter((product) => product.collection === collection)
        : products;

      grid.innerHTML = visibleProducts.map(productCard).join("");
    });
  }

  function updateGalleryButtons(gallery) {
    const visual = gallery.closest(".product-visual");
    const previous = visual?.querySelector('[data-gallery-nav="-1"]');
    const next = visual?.querySelector('[data-gallery-nav="1"]');
    if (!previous || !next) return;

    const maximum = gallery.scrollWidth - gallery.clientWidth;
    previous.disabled = gallery.scrollLeft <= 2;
    next.disabled = gallery.scrollLeft >= maximum - 2;
  }

  function initialiseProductGalleries() {
    document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
      gallery.addEventListener("scroll", () => updateGalleryButtons(gallery), {
        passive: true,
      });
      updateGalleryButtons(gallery);
    });
  }

  function installLightbox() {
    if (document.querySelector("#image-lightbox")) return;

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
            <button
              class="lightbox-arrow lightbox-arrow--next"
              type="button"
              data-lightbox-nav="1"
              aria-label="Next photograph"
            ><span aria-hidden="true">&rsaquo;</span></button>
            <div
              class="lightbox-track"
              data-lightbox-track
              tabindex="0"
              aria-label="Full-screen product photographs"
            ></div>
          </div>
          <p class="lightbox-counter" data-lightbox-counter aria-live="polite"></p>
        </dialog>
      `,
    );
  }

  const lightboxState = {
    images: [],
  };

  function lightboxElements() {
    return {
      dialog: document.querySelector("#image-lightbox"),
      title: document.querySelector("#lightbox-title"),
      track: document.querySelector("[data-lightbox-track]"),
      counter: document.querySelector("[data-lightbox-counter]"),
      previous: document.querySelector('[data-lightbox-nav="-1"]'),
      next: document.querySelector('[data-lightbox-nav="1"]'),
    };
  }

  function lightboxIndex(track) {
    if (!track?.clientWidth) return 0;
    return Math.round(track.scrollLeft / track.clientWidth);
  }

  function updateLightboxControls() {
    const { track, counter, previous, next } = lightboxElements();
    if (!track || !lightboxState.images.length) return;

    const index = lightboxIndex(track);
    const maximumIndex = lightboxState.images.length - 1;
    if (previous) {
      previous.disabled = index <= 0;
      previous.hidden = maximumIndex <= 0;
    }
    if (next) {
      next.disabled = index >= maximumIndex;
      next.hidden = maximumIndex <= 0;
    }
    if (counter) counter.textContent = `${index + 1} / ${lightboxState.images.length}`;
  }

  function moveLightbox(direction) {
    const { track } = lightboxElements();
    track?.scrollBy({
      left: direction * track.clientWidth,
      behavior: "smooth",
    });
  }

  function openLightbox(productId, imageIndex) {
    const product = productById(productId);
    if (!product?.images?.length) return;

    const { dialog, title, track } = lightboxElements();
    if (!dialog || !track) return;

    lightboxState.images = product.images;
    if (title) title.textContent = `${product.name} photographs`;
    track.innerHTML = product.images
      .map(
        (image) => `
          <div class="lightbox-slide">
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" />
          </div>
        `,
      )
      .join("");

    document.documentElement.classList.add("lightbox-open");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => {
      track.scrollLeft = imageIndex * track.clientWidth;
      updateLightboxControls();
      dialog.querySelector("[data-lightbox-close]")?.focus();
    });
  }

  function closeLightbox() {
    const { dialog } = lightboxElements();
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      cleanupLightbox();
    }
  }

  function cleanupLightbox() {
    const { track } = lightboxElements();
    document.documentElement.classList.remove("lightbox-open");
    lightboxState.images = [];
    if (track) track.innerHTML = "";
  }

  function initialiseLightbox() {
    installLightbox();
    const { dialog, track } = lightboxElements();

    track?.addEventListener("scroll", updateLightboxControls, {
      passive: true,
    });

    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) closeLightbox();
    });

    dialog?.addEventListener("close", cleanupLightbox);

    dialog?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveLightbox(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveLightbox(1);
      }
    });
  }

  function initialiseShopFilters() {
    const filterButtons = [...document.querySelectorAll("[data-filter-group]")];
    const shopProducts = [...document.querySelectorAll("[data-shop-grid] [data-product]")];
    const status = document.querySelector("#filter-status");
    const clearButton = document.querySelector("#clear-filters");
    const emptyState = document.querySelector("#empty-state");

    if (!filterButtons.length || !shopProducts.length || !status || !clearButton || !emptyState) return;

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
  }

  window.GloamwealdCart = {
    cartLineItems,
    cartSubtotal,
    clearCart,
    escapeHtml,
    money,
    moneyValue,
    productById,
    productPrice,
    readCart,
    removeCartItem,
    updateCartCount,
    updateCartItem,
    writeCart,
    CONTACT_EMAIL,
  };

  installCartLink();
  renderProductGrids();
  initialiseProductGalleries();
  initialiseLightbox();
  initialiseShopFilters();
  updateCartCount();

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
})();
