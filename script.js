(() => {
  "use strict";

  const catalog = window.GloamwealdCatalog || {};
  const products = window.GLOAMWEALD_PRODUCTS || [];
  const collections = window.GLOAMWEALD_COLLECTIONS || {};
  const productTypes = window.GLOAMWEALD_PRODUCT_TYPES || {};
  const CART_STORAGE_KEY = "gloamweald-cart";
  const RETURN_STORAGE_KEY = "gloamweald-catalog-return";
  const CONTACT_EMAIL = "gloamweald@gmail.com";
  const LORE_MIN_SCALE = 0.85;
  const LORE_MAX_SCALE = 1.45;
  const LORE_SCALE_STEP = 0.08;

  const typeLabels = {
    bracelets: "Bracelet",
    necklaces: "Necklace",
    "wallet-chains": "Wallet chain",
    cuffs: "Cuff",
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
    const catalogueAmount = catalog.productPriceAmount?.(product);
    if (Number.isFinite(catalogueAmount)) return catalogueAmount;

    const match = String(product?.displayPrice || product?.price || "").match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    return match ? Number(match[1]) : null;
  }

  function productDisplayPrice(product) {
    return catalog.productDisplayPrice?.(product) || product?.displayPrice || product?.price || "Price on enquiry";
  }

  function productById(id) {
    return catalog.productById?.(id) || products.find((product) => product.id === id);
  }

  function productBySlug(slug) {
    return catalog.productBySlug?.(slug) || products.find((product) => (product.slug || product.id) === slug);
  }

  function productSlug(product) {
    return catalog.productSlug?.(product) || product?.slug || product?.id || "";
  }

  function productUrl(product) {
    const slug = encodeURIComponent(productSlug(product));
    return slug ? `product.html?product=${slug}` : "shop.html";
  }

  function productTypeUrl(type) {
    const config = productTypes[type];
    return config?.fallbackUrl || (type ? `/types/${encodeURIComponent(type)}` : "shop.html");
  }

  function contactPageLink(label, className = "quiet-button") {
    return `<a class="${className}" href="contact.html" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
  }

  function productHasLore(product) {
    return typeof product?.lore === "string" && product.lore.trim().length > 0;
  }

  function productLoreButton(product) {
    if (!productHasLore(product)) return "";

    return `
      <button
        class="lore-button"
        type="button"
        data-lore-open="${escapeHtml(product.id)}"
        aria-label="Read lore for ${escapeHtml(product.name)}"
      ><span aria-hidden="true">~ LORE ~</span></button>
    `;
  }

  function loreTextHtml(lore) {
    return String(lore)
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  function loreCssValue(value) {
    const color = String(value || "").trim();
    if (!color || /[;{}<>]/.test(color)) return "";
    return color;
  }

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => {
          try {
            if (catalog.configuredCartLine) {
              return catalog.configuredCartLine({
                productId: item.productId || item.id,
                quantity: item.quantity,
                selections: item.selections || {},
              });
            }

            const product = productById(item.productId || item.id);
            const price = productPrice(product);
            if (!product?.orderable || price === null) return null;
            return {
              id: product.id,
              key: product.id,
              productId: product.id,
              productName: product.name,
              quantity: Math.max(1, Number(item.quantity) || 1),
              basePrice: price,
              finalUnitPrice: price,
              price,
              selections: {},
              lineSummary: "",
              product,
            };
          } catch (error) {
            console.warn("Removed invalid cart item.", error);
            return null;
          }
        })
        .filter(Boolean);
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
    const stored = cart.map((item) => ({
      key: item.key || item.id,
      id: item.productId || item.id,
      productId: item.productId || item.id,
      productName: item.productName,
      quantity: Math.max(1, Number(item.quantity) || 1),
      basePrice: item.basePrice,
      finalUnitPrice: item.finalUnitPrice || item.price,
      selections: item.selections || {},
      lineSummary: item.lineSummary || "",
    }));
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored));
    refreshCartUi();
  }

  function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    refreshCartUi();
  }

  function cartLineItems() {
    return readCart()
      .map((item) => ({
        ...item,
        product: item.product || productById(item.productId || item.id),
        price: item.finalUnitPrice || item.price,
        lineTotal: Math.round((item.finalUnitPrice || item.price) * item.quantity * 100) / 100,
      }))
      .filter((item) => item.product && item.price !== null);
  }

  function cartSubtotal() {
    return cartLineItems().reduce((total, item) => total + item.lineTotal, 0);
  }

  function addConfiguredToCart(line) {
    const cart = readCart();
    const existing = cart.find((item) => (item.key || item.id) === (line.key || line.id));
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + line.quantity);
    } else {
      cart.push(line);
    }

    writeCart(cart);
    announceCart(`${line.productName} added to cart.`);
  }

  function updateCartItem(cartKey, quantity) {
    const cart = readCart()
      .map((item) =>
        (item.key || item.id) === cartKey
          ? { ...item, quantity: Math.max(0, quantity) }
          : item,
      )
      .filter((item) => item.quantity > 0);
    writeCart(cart);
  }

  function removeCartItem(cartKey) {
    writeCart(readCart().filter((item) => (item.key || item.id) !== cartKey));
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

  function catalogueReturnState() {
    return {
      url: `${location.pathname}${location.search}${location.hash}`,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      timestamp: Date.now(),
    };
  }

  function saveCatalogueReturnState() {
    try {
      sessionStorage.setItem(RETURN_STORAGE_KEY, JSON.stringify(catalogueReturnState()));
    } catch {
      /* Continue without return-state persistence if storage is unavailable. */
    }
  }

  function savedReturnState() {
    try {
      return JSON.parse(sessionStorage.getItem(RETURN_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function continueShoppingUrl(product) {
    const state = savedReturnState();
    if (state?.url && Date.now() - Number(state.timestamp || 0) < 1000 * 60 * 60) {
      return state.url;
    }
    return productTypeUrl(product?.type);
  }

  function restoreCatalogueScrollWhenReady() {
    const state = savedReturnState();
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (!state?.url || state.url !== current) return;

    window.setTimeout(() => {
      window.scrollTo({
        left: Number(state.scrollX) || 0,
        top: Number(state.scrollY) || 0,
        behavior: "auto",
      });
    }, 80);
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
    return `
      <div class="product-actions">
        <a
          class="button button--solid"
          href="${escapeHtml(productUrl(product))}"
          data-product-link
          data-product-id="${escapeHtml(product.id)}"
        >View &amp; customise</a>
      </div>
    `;
  }

  function productCard(product) {
    const componentTags = product.components
      .map((component) => `<span>${escapeHtml(component)}</span>`)
      .join("");
    const collection = product.collection ? collections[product.collection] : null;
    const collectionTag = collection
      ? `<a class="product-collection-link" href="${escapeHtml(collection.url)}">${escapeHtml(collection.name)}</a>`
      : "";
    const price = productPrice(product);
    const madeToOrder = product.orderable && /made to order/i.test(product.status || "");

    return `
      <article
        class="product-card"
        data-product
        data-product-id="${escapeHtml(product.id)}"
        data-product-slug="${escapeHtml(productSlug(product))}"
        data-type="${escapeHtml(product.type)}"
        data-collection="${escapeHtml(product.collection || "")}"
        data-components="${escapeHtml(product.components.join(" "))}"
        data-price-value="${price === null ? "" : escapeHtml(String(price))}"
        data-orderable="${product.orderable ? "true" : "false"}"
        data-made-to-order="${madeToOrder ? "true" : "false"}"
      >
        ${productMedia(product)}
        <div class="product-details">
          <div class="product-tags" aria-label="Product categories">
            <span>${escapeHtml(typeLabels[product.type] || product.type)}</span>
            ${componentTags}
            ${collectionTag}
          </div>
          <div class="product-title-row">
            <div class="product-title-copy">
              <h3><a href="${escapeHtml(productUrl(product))}" data-product-link data-product-id="${escapeHtml(product.id)}">${escapeHtml(product.name)}</a></h3>
              <p class="price">${escapeHtml(productDisplayPrice(product))}</p>
            </div>
            ${productLoreButton(product)}
          </div>
          <p class="product-description">${escapeHtml(product.description)}</p>
          <dl class="product-specs">
            <div><dt>Material</dt><dd>${escapeHtml(product.material)}</dd></div>
            <div><dt>Clasp</dt><dd>${escapeHtml(product.clasp)}</dd></div>
            <div><dt>Dimensions</dt><dd>${escapeHtml(product.dimensions)}</dd></div>
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
      const type = grid.dataset.type;
      const visibleProducts = products.filter((product) => {
        const matchesCollection = !collection || product.collection === collection;
        const matchesType = !type || product.type === type;
        return matchesCollection && matchesType;
      });

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

  function installLoreDialog() {
    if (document.querySelector("#product-lore-dialog")) return;

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <dialog class="lore-dialog" id="product-lore-dialog" aria-labelledby="product-lore-title" aria-describedby="product-lore-copy">
          <div class="lore-dialog__panel" data-lore-panel>
            <button class="lore-dialog__close" type="button" data-lore-close aria-label="Close lore">
              <span aria-hidden="true">&times;</span>
            </button>
            <p class="lore-dialog__eyebrow">From the Gloamweald</p>
            <h2 id="product-lore-title" data-lore-title></h2>
            <div class="lore-dialog__tools" aria-label="Lore text size">
              <span>Text size</span>
              <button type="button" data-lore-zoom="-1" aria-label="Decrease lore text size">&minus;</button>
              <button type="button" data-lore-zoom="1" aria-label="Increase lore text size">+</button>
            </div>
            <div class="lore-dialog__scroll" tabindex="0" data-lore-scroll>
              <div class="lore-dialog__copy" id="product-lore-copy" data-lore-copy></div>
            </div>
          </div>
        </dialog>
      `,
    );
  }

  const lightboxState = {
    images: [],
  };

  const loreState = {
    opener: null,
    scale: 1,
    pinchStartDistance: null,
    pinchStartScale: 1,
    scrollX: 0,
    scrollY: 0,
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

  function loreElements() {
    return {
      dialog: document.querySelector("#product-lore-dialog"),
      title: document.querySelector("[data-lore-title]"),
      copy: document.querySelector("[data-lore-copy]"),
      scroll: document.querySelector("[data-lore-scroll]"),
      close: document.querySelector("[data-lore-close]"),
    };
  }

  function currentWindowScroll() {
    return {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
    };
  }

  function restoreWindowScroll(x = loreState.scrollX, y = loreState.scrollY) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    window.scrollTo(x, y);
  }

  function focusWithoutScroll(element) {
    if (!element) return;
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  }

  function clamp(number, min, max) {
    return Math.min(max, Math.max(min, number));
  }

  function setLoreScale(scale) {
    const { dialog } = loreElements();
    loreState.scale = clamp(scale, LORE_MIN_SCALE, LORE_MAX_SCALE);
    dialog?.style.setProperty("--lore-text-scale", loreState.scale.toFixed(2));
  }

  function adjustLoreScale(amount) {
    setLoreScale(loreState.scale + amount);
  }

  function touchDistance(touches) {
    const [first, second] = touches;
    const x = second.clientX - first.clientX;
    const y = second.clientY - first.clientY;
    return Math.hypot(x, y);
  }

  function applyLoreTheme(product) {
    const { dialog } = loreElements();
    if (!dialog) return;

    const accent = loreCssValue(product?.loreAccent);
    const glow = loreCssValue(product?.loreGlow);
    const accentPale = loreCssValue(product?.loreAccentPale);

    if (accent) {
      dialog.style.setProperty("--lore-accent", accent);
    } else {
      dialog.style.removeProperty("--lore-accent");
    }

    if (glow) {
      dialog.style.setProperty("--lore-glow", glow);
    } else {
      dialog.style.removeProperty("--lore-glow");
    }

    if (accentPale) {
      dialog.style.setProperty("--lore-accent-pale", accentPale);
    } else {
      dialog.style.removeProperty("--lore-accent-pale");
    }
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

  function openLore(productId, opener) {
    const product = productById(productId);
    if (!productHasLore(product)) return;

    const { dialog, title, copy, scroll, close } = loreElements();
    if (!dialog || !title || !copy) return;

    const position = currentWindowScroll();
    loreState.scrollX = position.x;
    loreState.scrollY = position.y;
    loreState.opener = opener || null;
    setLoreScale(1);
    applyLoreTheme(product);
    title.innerHTML = escapeHtml(product.name);
    copy.innerHTML = loreTextHtml(product.lore);
    if (scroll) scroll.scrollTop = 0;

    document.documentElement.classList.add("lightbox-open");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    restoreWindowScroll();

    requestAnimationFrame(() => {
      focusWithoutScroll(close);
      restoreWindowScroll();
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

  function closeLore() {
    const { dialog } = loreElements();
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      cleanupLore();
    }
  }

  function cleanupLightbox() {
    const { track } = lightboxElements();
    document.documentElement.classList.remove("lightbox-open");
    lightboxState.images = [];
    if (track) track.innerHTML = "";
  }

  function cleanupLore() {
    const { title, copy, dialog } = loreElements();
    const scrollX = loreState.scrollX;
    const scrollY = loreState.scrollY;
    document.documentElement.classList.remove("lightbox-open");
    if (title) title.textContent = "";
    if (copy) copy.innerHTML = "";
    dialog?.style.removeProperty("--lore-text-scale");
    dialog?.style.removeProperty("--lore-accent");
    dialog?.style.removeProperty("--lore-glow");
    dialog?.style.removeProperty("--lore-accent-pale");
    loreState.scale = 1;
    loreState.pinchStartDistance = null;
    loreState.pinchStartScale = 1;

    const opener = loreState.opener;
    loreState.opener = null;
    if (opener?.isConnected) focusWithoutScroll(opener);
    restoreWindowScroll(scrollX, scrollY);
    loreState.scrollX = 0;
    loreState.scrollY = 0;
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

  function initialiseLoreDialog() {
    installLoreDialog();
    const { dialog, scroll } = loreElements();

    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) closeLore();
    });

    dialog?.addEventListener("close", cleanupLore);

    scroll?.addEventListener(
      "wheel",
      (event) => {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) return;
        event.preventDefault();
        adjustLoreScale(event.deltaY < 0 ? LORE_SCALE_STEP : -LORE_SCALE_STEP);
      },
      { passive: false },
    );

    scroll?.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 2) return;
        loreState.pinchStartDistance = touchDistance(event.touches);
        loreState.pinchStartScale = loreState.scale;
      },
      { passive: true },
    );

    scroll?.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length !== 2 || !loreState.pinchStartDistance) return;
        event.preventDefault();
        const ratio = touchDistance(event.touches) / loreState.pinchStartDistance;
        setLoreScale(loreState.pinchStartScale * ratio);
      },
      { passive: false },
    );

    scroll?.addEventListener(
      "touchend",
      () => {
        loreState.pinchStartDistance = null;
      },
      { passive: true },
    );
  }

  function initialiseShopFilters() {
    const filterButtons = [...document.querySelectorAll("[data-filter-group]")];
    const shopProducts = [...document.querySelectorAll("[data-shop-grid] [data-product]")];
    const status = document.querySelector("#filter-status");
    const clearButton = document.querySelector("#clear-filters");
    const emptyState = document.querySelector("#empty-state");
    const sortSelect = document.querySelector("#shop-sort");
    const shopGrid = document.querySelector("[data-shop-grid]");

    if (!filterButtons.length || !shopProducts.length || !status || !clearButton || !emptyState) return;

    const params = new URLSearchParams(location.search);
    const selected = {
      type: params.get("type") || "all",
      component: params.get("component") || "all",
    };
    const defaultOrder = new Map(shopProducts.map((product, index) => [product, index]));

    function productSortPrice(card) {
      const rawPrice = card.dataset.priceValue;
      if (!rawPrice) return null;
      const price = Number(rawPrice);
      return Number.isFinite(price) ? price : null;
    }

    function defaultSort(a, b) {
      return defaultOrder.get(a) - defaultOrder.get(b);
    }

    function comparePrice(direction) {
      return (a, b) => {
        const priceA = productSortPrice(a);
        const priceB = productSortPrice(b);

        if (priceA === null && priceB === null) return defaultSort(a, b);
        if (priceA === null) return 1;
        if (priceB === null) return -1;

        return direction === "ascending"
          ? priceA - priceB || defaultSort(a, b)
          : priceB - priceA || defaultSort(a, b);
      };
    }

    function availableSort(a, b) {
      const aOrderable = a.dataset.orderable === "true";
      const bOrderable = b.dataset.orderable === "true";
      const aMadeToOrder = a.dataset.madeToOrder === "true";
      const bMadeToOrder = b.dataset.madeToOrder === "true";

      if (aOrderable !== bOrderable) {
        return aOrderable ? -1 : 1;
      }

      if (aMadeToOrder !== bMadeToOrder) {
        return aMadeToOrder ? -1 : 1;
      }

      return defaultSort(a, b);
    }

    function sortProducts() {
      if (!sortSelect || !shopGrid) return;

      const sortedProducts = [...shopProducts].sort((a, b) => {
        switch (sortSelect.value) {
          case "price-ascending":
            return comparePrice("ascending")(a, b);
          case "price-descending":
            return comparePrice("descending")(a, b);
          case "made-to-order":
            return availableSort(a, b);
          case "default":
          default:
            return defaultSort(a, b);
        }
      });

      shopGrid.append(...sortedProducts);
    }

    function setPressedState(group, value) {
      const hasMatchingButton = filterButtons.some(
        (button) => button.dataset.filterGroup === group && button.dataset.filterValue === value,
      );
      const safeValue = hasMatchingButton ? value : "all";
      selected[group] = safeValue;
      filterButtons
        .filter((button) => button.dataset.filterGroup === group)
        .forEach((button) => {
          button.setAttribute("aria-pressed", String(button.dataset.filterValue === safeValue));
        });
    }

    function updateShopUrl() {
      const next = new URLSearchParams(location.search);
      selected.type === "all" ? next.delete("type") : next.set("type", selected.type);
      selected.component === "all" ? next.delete("component") : next.set("component", selected.component);
      sortSelect?.value && sortSelect.value !== "default" ? next.set("sort", sortSelect.value) : next.delete("sort");
      const query = next.toString();
      history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
    }

    function updateProducts() {
      let visibleCount = 0;
      const availabilityOnly = sortSelect?.value === "made-to-order";

      shopProducts.forEach((product) => {
        const components = product.dataset.components.split(/\s+/).filter(Boolean);
        const matchesType =
          selected.type === "all" || product.dataset.type === selected.type;
        const matchesComponent =
          selected.component === "all" || components.includes(selected.component);
        const matchesAvailability = !availabilityOnly || product.dataset.orderable === "true";
        const isVisible = matchesType && matchesComponent && matchesAvailability;

        product.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      const filtersAreClear =
        selected.type === "all" && selected.component === "all";
      const productSetIsClear = filtersAreClear && !availabilityOnly;

      clearButton.hidden = filtersAreClear;
      emptyState.hidden = visibleCount !== 0;
      status.textContent = productSetIsClear
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
        updateShopUrl();
        updateProducts();
      });
    });

    clearButton.addEventListener("click", () => {
      selected.type = "all";
      selected.component = "all";
      setPressedState("type", "all");
      setPressedState("component", "all");
      updateShopUrl();
      updateProducts();
    });

    sortSelect?.addEventListener("change", () => {
      sortProducts();
      updateShopUrl();
      updateProducts();
    });

    setPressedState("type", selected.type);
    setPressedState("component", selected.component);
    if (sortSelect) {
      const requestedSort = params.get("sort") || "default";
      sortSelect.value = [...sortSelect.options].some((option) => option.value === requestedSort)
        ? requestedSort
        : "default";
    }
    sortProducts();
    updateProducts();
  }

  function priceDeltaLabel(amount) {
    const value = Number(amount || 0);
    if (!value) return "Included";
    return `+${money.format(value)}`;
  }

  function productSlugFromLocation() {
    const params = new URLSearchParams(location.search);
    const requested = params.get("slug") || params.get("product");
    if (requested) return requested;

    const parts = location.pathname.split("/").filter(Boolean);
    const productIndex = parts.indexOf("products");
    if (productIndex >= 0) return decodeURIComponent(parts[productIndex + 1] || "");
    return "";
  }

  function updateProductMeta(product) {
    document.title = `${product.name} | Gloamweald`;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", product.description || `${product.name} by Gloamweald.`);
    }
    const image = product.images?.[0]?.src;
    if (image) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement("meta");
        ogImage.setAttribute("property", "og:image");
        document.head.append(ogImage);
      }
      ogImage.setAttribute("content", image);
    }
  }

  function renderProductPageGallery(product) {
    const images = product.images?.length
      ? product.images
      : [
          {
            src: "",
            alt: `Photography coming soon for ${product.name}`,
          },
        ];

    if (!product.images?.length) {
      return `
        <div class="product-page-gallery product-page-gallery--placeholder">
          <div class="product-visual product-visual--${escapeHtml(product.visual || "classic")}">
            <span>Photography coming soon</span>
            <i aria-hidden="true"></i>
          </div>
        </div>
      `;
    }

    const slides = images
      .map(
        (image, index) => `
          <button
            class="product-photo"
            type="button"
            data-lightbox-open="${escapeHtml(product.id)}"
            data-image-index="${index}"
            aria-label="Open image ${index + 1} of ${images.length} for ${escapeHtml(product.name)} full-screen"
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
      images.length > 1
        ? `
          <button class="gallery-arrow gallery-arrow--previous" type="button" data-gallery-nav="-1" aria-label="Previous ${escapeHtml(product.name)} photograph" disabled><span aria-hidden="true">&lsaquo;</span></button>
          <button class="gallery-arrow gallery-arrow--next" type="button" data-gallery-nav="1" aria-label="Next ${escapeHtml(product.name)} photograph"><span aria-hidden="true">&rsaquo;</span></button>
        `
        : "";

    return `
      <div class="product-page-gallery product-visual product-visual--photo">
        <div class="product-gallery" tabindex="0" data-product-gallery aria-label="${escapeHtml(product.name)} product photographs">
          ${slides}
        </div>
        ${controls}
      </div>
    `;
  }

  function renderProductSpecs(product) {
    const specs = [
      ["Material", product.material],
      ["Clasp", product.clasp],
      ["Dimensions", product.dimensions],
      ["Status", product.status],
    ].filter(([, value]) => String(value || "").trim());

    if (!specs.length) return "";

    return `
      <dl class="product-specs product-specs--page">
        ${specs
          .map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`)
          .join("")}
      </dl>
    `;
  }

  function productLoreSection(product) {
    if (!productHasLore(product)) return "";
    return `
      <section class="product-page-lore" aria-labelledby="product-page-lore-title">
        <p class="eyebrow">From the Gloamweald</p>
        <h2 id="product-page-lore-title">Lore</h2>
        <div class="product-page-lore__copy">${loreTextHtml(product.lore)}</div>
      </section>
    `;
  }

  function measuringGuideHtml(product) {
    if (!["bracelets", "cuffs"].includes(product.type)) return "";

    return `
      <details class="measuring-guide">
        <summary aria-expanded="false">How do I choose my bracelet length?</summary>
        <div>
          <h4>How to choose your bracelet length</h4>
          <p>If you do not already own a bracelet to measure:</p>
          <ol>
            <li>Wrap a flexible measuring tape around your wrist where you want the bracelet to sit.</li>
            <li>Keep the tape against your skin without pulling it tight.</li>
            <li>Record your wrist measurement, then add:</li>
          </ol>
          <ul>
            <li><strong>1-1.5 cm</strong> for a close fit</li>
            <li><strong>1.5-2 cm</strong> for a comfortable fit</li>
            <li><strong>2-2.5 cm</strong> for a loose fit</li>
          </ul>
          <p>For example, if your wrist measures 17 cm, choose approximately 18.5-19 cm for a comfortable fit.</p>
          <p>No measuring tape? Wrap a piece of string around your wrist, mark where the ends meet, then measure the string against a ruler.</p>
          <p>Wider or heavier bracelets can feel tighter than finer chains, so choose the larger option if you are between sizes. You can also add the complimentary extender for greater adjustability.</p>
        </div>
      </details>
    `;
  }

  function renderLengthSelector(product) {
    const config = product.customisation?.length;
    if (!config?.enabled) return "";

    const options = catalog.lengthOptionsForProduct?.(product) || config.options || [];
    if (!options.length) return "";

    const descriptionId = `length-help-${escapeHtml(product.id)}`;
    const label = config.label || (product.type === "necklaces" ? "Finished necklace length" : "Finished bracelet length");
    const requiredMark = config.required ? " *" : "";
    const helper =
      config.helperText ||
      (product.type === "wallet-chains"
        ? "Choose the complete end-to-end length, including attachment hardware."
        : "Choose the completed end-to-end length of the bracelet, including the clasp.");

    const control =
      options.length > 8
        ? `
          <label class="custom-select">
            <span class="visually-hidden">${escapeHtml(label)}</span>
            <select name="length" ${config.required ? "required" : ""} aria-describedby="${descriptionId}">
              <option value="">Choose a length</option>
              ${options
                .map(
                  (option) => `
                    <option value="${escapeHtml(option.value)}">
                      ${escapeHtml(option.label)}${option.priceDelta ? ` - +${money.format(option.priceDelta)}` : ""}
                    </option>
                  `,
                )
                .join("")}
            </select>
          </label>
        `
        : `
          <div class="size-options">
            ${options
              .map(
                (option) => `
                  <label class="size-option">
                    <input type="radio" name="length" value="${escapeHtml(option.value)}" ${config.required ? "required" : ""} />
                    <span>${escapeHtml(option.label)}</span>
                    <small>${escapeHtml(priceDeltaLabel(option.priceDelta))}</small>
                  </label>
                `,
              )
              .join("")}
          </div>
        `;

    return `
      <fieldset class="customisation-field customisation-field--length">
        <legend>${escapeHtml(label)}${requiredMark}</legend>
        <p id="${descriptionId}">${escapeHtml(helper)}</p>
        ${control}
        ${config.toleranceNote ? `<p class="field-note">${escapeHtml(config.toleranceNote)}</p>` : ""}
        ${measuringGuideHtml(product)}
      </fieldset>
    `;
  }

  function renderClaspSelector(product) {
    const config = product.customisation?.clasp;
    if (!config?.enabled) return "";

    const options = catalog.claspOptionsForProduct?.(product) || [];
    if (!options.length) return "";

    return `
      <fieldset class="customisation-field customisation-field--clasp">
        <legend>Choose your clasp</legend>
        <p>The clasp shown in the product photographs is included. You can keep the pictured clasp or choose another compatible style.</p>
        <div class="clasp-options">
          ${options
            .map((option, index) => {
              const image = option.image
                ? `<img src="${escapeHtml(option.image)}" alt="${escapeHtml(option.label || option.name)}" loading="lazy" />`
                : `<span class="clasp-placeholder" aria-hidden="true">?</span>`;
              return `
                <label class="clasp-option">
                  <input type="radio" name="clasp" value="${escapeHtml(option.id)}" ${index === 0 ? "checked" : ""} />
                  <span class="clasp-option__image">${image}</span>
                  <span class="clasp-option__name">${escapeHtml(option.label || option.name)}</span>
                  <span class="clasp-option__meta">${escapeHtml(option.dimensions || "Measurement to be added")}</span>
                  <span class="clasp-option__price">${escapeHtml(priceDeltaLabel(option.priceDelta))}</span>
                </label>
              `;
            })
            .join("")}
        </div>
      </fieldset>
    `;
  }

  function renderExtenderSelector(product) {
    const config = product.customisation?.extender;
    if (!config?.enabled) return "";

    const lengthCm = Number(config.lengthCm) || 3;
    return `
      <fieldset class="customisation-field customisation-field--extender" data-extender-field>
        <legend>Add an extender</legend>
        <p>The extender provides up to approximately ${lengthCm} cm of additional adjustable length. The bracelet itself will still be made to the finished length selected above.</p>
        <div class="extender-options">
          <label class="size-option">
            <input type="radio" name="extender" value="no" checked />
            <span>No extender</span>
          </label>
          <label class="size-option">
            <input type="radio" name="extender" value="yes" />
            <span>Add a ${lengthCm} cm extender</span>
            <small>${escapeHtml(priceDeltaLabel(config.priceDelta))}</small>
          </label>
        </div>
        <p class="field-note" data-extender-note></p>
      </fieldset>
    `;
  }

  function renderCustomisationForm(product) {
    const orderable = product.orderable && productPrice(product) !== null;
    const note = product.customisation?.hardwareNote
      ? `<p class="field-note">${escapeHtml(product.customisation.hardwareNote)}</p>`
      : "";

    if (!orderable) {
      return `
        <div class="product-purchase-panel product-purchase-panel--inquiry">
          <p>${escapeHtml(product.status || "This piece is not currently available to order.")}</p>
          ${contactPageLink("Send an inquiry", "button button--solid")}
        </div>
      `;
    }

    return `
      <form class="product-purchase-form" data-product-form data-product-id="${escapeHtml(product.id)}">
        ${renderLengthSelector(product)}
        ${renderClaspSelector(product)}
        ${renderExtenderSelector(product)}
        ${note}
        <section class="price-summary" aria-live="polite" data-price-summary></section>
        <p class="form-error" data-product-form-error role="alert"></p>
        <div class="product-page-actions">
          <button class="button button--solid" type="submit" data-product-add-button>Add to cart</button>
          ${contactPageLink("Ask a question")}
        </div>
      </form>
    `;
  }

  function productPageSelections(form) {
    const data = new FormData(form);
    return {
      length: data.get("length") || "",
      clasp: data.get("clasp") || "pictured",
      extender: data.get("extender") === "yes",
    };
  }

  function setFormControlValue(form, name, value) {
    if (value === undefined || value === null || value === "") return;

    const controls = Array.from(form.querySelectorAll(`[name="${name}"]`));
    if (!controls.length) return;

    if (controls.length === 1 && controls[0].tagName !== "INPUT") {
      controls[0].value = String(value);
      return;
    }

    const matching = controls.find((control) => control.value === String(value));
    if (matching && "checked" in matching) {
      matching.checked = true;
    } else if (controls.length === 1) {
      controls[0].value = String(value);
    }
  }

  function applyCartEditParams(form, product) {
    const params = new URLSearchParams(location.search);
    const editCartKey = params.get("editCart") || "";
    const editItem = editCartKey
      ? readCart().find(
          (item) => (item.key || item.id) === editCartKey && item.productId === product.id,
        )
      : null;
    const savedSelections = editItem?.selections || {};

    setFormControlValue(form, "length", params.get("length") || savedSelections.length?.value);
    setFormControlValue(form, "clasp", params.get("clasp") || savedSelections.clasp?.id);

    const extender =
      params.get("extender") ||
      (savedSelections.extender ? (savedSelections.extender.selected ? "yes" : "no") : "");
    setFormControlValue(form, "extender", extender);

    if (editItem) {
      form.dataset.editCartKey = editCartKey;
      form.dataset.editQuantity = String(editItem.quantity || Number(params.get("quantity")) || 1);
      const button = form.querySelector("[data-product-add-button]");
      if (button) button.textContent = "Update cart";
    }
  }

  function formHasRequiredSelections(product, selections) {
    const length = product.customisation?.length;
    return !length?.enabled || !length.required || selections.length;
  }

  function selectedClaspSupportsExtender(product, claspId) {
    const option = catalog.findClaspOption?.(product, claspId);
    return option?.supportsExtender !== false;
  }

  function updateProductPurchaseForm(form) {
    const product = productById(form.dataset.productId);
    if (!product) return;

    const selections = productPageSelections(form);
    const addButton = form.querySelector("[data-product-add-button]");
    const error = form.querySelector("[data-product-form-error]");
    const summary = form.querySelector("[data-price-summary]");
    const extenderField = form.querySelector("[data-extender-field]");
    const extenderYes = form.querySelector('input[name="extender"][value="yes"]');
    const extenderNo = form.querySelector('input[name="extender"][value="no"]');
    const extenderNote = form.querySelector("[data-extender-note]");

    if (extenderField) {
      const supports = selectedClaspSupportsExtender(product, selections.clasp);
      extenderField.classList.toggle("is-disabled", !supports);
      if (!supports && extenderYes?.checked) {
        extenderNo.checked = true;
        selections.extender = false;
        if (extenderNote) {
          extenderNote.textContent = "The extender was removed because the newly selected clasp does not support it.";
        }
      } else if (extenderNote) {
        extenderNote.textContent = supports ? "" : "Extenders are not available with this clasp style.";
      }
      if (extenderYes) extenderYes.disabled = !supports;
    }

    const complete = formHasRequiredSelections(product, selections);
    if (!complete) {
      if (addButton) addButton.disabled = true;
      if (summary) {
        summary.innerHTML = `
          <h3>Price</h3>
          <p class="summary-total">Total: ${escapeHtml(productDisplayPrice(product))}</p>
          <p class="field-note">Choose the required options to confirm the final price.</p>
        `;
      }
      if (error) error.textContent = "";
      return;
    }

    try {
      const line = catalog.configuredCartLine({
        productId: product.id,
        quantity: 1,
        selections,
      });
      if (addButton) addButton.disabled = false;
      if (error) error.textContent = "";
      if (summary) {
        summary.innerHTML = `
          <h3>Price</h3>
          <dl>
            <div><dt>${escapeHtml(product.name)}</dt><dd>${money.format(line.basePrice)}</dd></div>
            ${
              line.selections.length?.priceDelta
                ? `<div><dt>${escapeHtml(line.selections.length.label)}</dt><dd>+${money.format(line.selections.length.priceDelta)}</dd></div>`
                : ""
            }
            ${
              line.selections.clasp?.priceDelta
                ? `<div><dt>${escapeHtml(line.selections.clasp.label)}</dt><dd>+${money.format(line.selections.clasp.priceDelta)}</dd></div>`
                : ""
            }
            ${
              line.selections.extender?.selected
                ? `<div><dt>${escapeHtml(line.selections.extender.label)}</dt><dd>${escapeHtml(priceDeltaLabel(line.selections.extender.priceDelta))}</dd></div>`
                : ""
            }
            <div class="summary-total"><dt>Total</dt><dd>${money.format(line.finalUnitPrice)}</dd></div>
          </dl>
        `;
      }
    } catch (validationError) {
      if (addButton) addButton.disabled = true;
      if (error) error.textContent = validationError.message;
    }
  }

  function renderProductPage() {
    const root = document.querySelector("[data-product-page]");
    if (!root) return;

    const product = productBySlug(productSlugFromLocation());
    if (!product) {
      root.innerHTML = `
        <section class="section product-not-found">
          <p class="eyebrow">Lost in the trees</p>
          <h1>Product not found</h1>
          <p>This piece may have moved, changed name, or not yet made it out of the weald.</p>
          <a class="button button--solid" href="shop.html">Return to shop</a>
        </section>
      `;
      return;
    }

    updateProductMeta(product);
    root.innerHTML = `
      <section class="section product-page">
        <a class="quiet-button product-back-link" href="${escapeHtml(continueShoppingUrl(product))}" data-continue-shopping>Continue shopping</a>
        <div class="product-page-layout">
          <div class="product-page__media">
            ${renderProductPageGallery(product)}
          </div>
          <div class="product-page__info">
            <p class="eyebrow">${escapeHtml(typeLabels[product.type] || product.type)}</p>
            <h1>${escapeHtml(product.name)}</h1>
            <p class="price product-page-price">${escapeHtml(productDisplayPrice(product))}</p>
            <p>${escapeHtml(product.description)}</p>
            ${renderProductSpecs(product)}
            ${renderCustomisationForm(product)}
          </div>
        </div>
        ${productLoreSection(product)}
      </section>
    `;

    root.querySelectorAll("[data-product-form]").forEach((form) => {
      applyCartEditParams(form, product);
      updateProductPurchaseForm(form);
    });
    initialiseProductGalleries();
  }

  function installAddToCartDialog() {
    if (document.querySelector("#add-to-cart-dialog")) return;

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <dialog class="cart-confirmation-dialog" id="add-to-cart-dialog" aria-labelledby="cart-confirmation-title">
          <div class="cart-confirmation-panel">
            <button class="cart-confirmation-close" type="button" data-cart-confirm-close aria-label="Close added-to-cart message">
              <span aria-hidden="true">&times;</span>
            </button>
            <h2 id="cart-confirmation-title">Added to your cart</h2>
            <div data-cart-confirm-body></div>
            <div class="cart-confirmation-actions">
              <button class="button" type="button" data-cart-confirm-continue>Continue shopping</button>
              <a class="button button--solid" href="cart.html">View cart</a>
            </div>
          </div>
        </dialog>
      `,
    );
  }

  const cartConfirmState = {
    opener: null,
    product: null,
  };

  function openAddToCartDialog(line, product, opener, action = "added") {
    const dialog = document.querySelector("#add-to-cart-dialog");
    const body = dialog?.querySelector("[data-cart-confirm-body]");
    const title = dialog?.querySelector("#cart-confirmation-title");
    if (!dialog || !body) return;

    const image = product.images?.[0];
    cartConfirmState.opener = opener || null;
    cartConfirmState.product = product;
    if (title) title.textContent = action === "updated" ? "Updated your cart" : "Added to your cart";

    body.innerHTML = `
      <div class="cart-confirmation-item">
        ${
          image
            ? `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" />`
            : `<div class="cart-confirmation-placeholder" aria-hidden="true"></div>`
        }
        <div>
          <h3>${escapeHtml(line.productName)}</h3>
          ${line.lineSummary ? `<p>${escapeHtml(line.lineSummary)}</p>` : ""}
          <strong>${money.format(line.finalUnitPrice)}</strong>
        </div>
      </div>
    `;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      document.documentElement.classList.add("lightbox-open");
      dialog.querySelector("[data-cart-confirm-continue]")?.focus();
    }
  }

  function closeAddToCartDialog() {
    const dialog = document.querySelector("#add-to-cart-dialog");
    if (!dialog?.open) return;
    dialog.close();
  }

  function renderProductTypePage() {
    const root = document.querySelector("[data-product-type-page]");
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const pathParts = location.pathname.split("/").filter(Boolean);
    const typeIndex = pathParts.indexOf("types");
    const type = params.get("type") || (typeIndex >= 0 ? decodeURIComponent(pathParts[typeIndex + 1] || "") : "");
    const config = productTypes[type];
    const typeProducts = products.filter((product) => product.type === type);

    if (!config || !typeProducts.length) {
      root.innerHTML = `
        <section class="section product-not-found">
          <p class="eyebrow">A path not yet marked</p>
          <h1>Product type not found</h1>
          <p>This category is not available yet.</p>
          <a class="button button--solid" href="shop.html">Return to shop</a>
        </section>
      `;
      return;
    }

    document.title = `${config.title} | Gloamweald`;
    root.innerHTML = `
      <header class="page-hero page-hero--shop">
        <p class="eyebrow">By type</p>
        <h1>${escapeHtml(config.title)}</h1>
        <p>${escapeHtml(config.description)}</p>
      </header>
      <section class="section shop-section">
        <details class="type-buying-guide">
          <summary>${escapeHtml(config.buyingGuideTitle || "Sizing & customisation guide")}</summary>
          <ul>
            ${(config.buyingGuide || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </details>
        <div class="filter-panel" aria-label="${escapeHtml(config.title)} filters">
          <fieldset class="filter-group filter-group--sort">
            <legend>Sort by</legend>
            <div class="filter-options filter-options--sort">
              <select class="shop-sort" data-type-sort aria-label="Sort ${escapeHtml(config.title)} products">
                <option value="default">Default</option>
                <option value="price-ascending">Price: Low-to-high</option>
                <option value="price-descending">Price: High-to-low</option>
                <option value="made-to-order">Available (Made to order)</option>
              </select>
            </div>
          </fieldset>
          <div class="filter-summary">
            <p data-type-filter-status aria-live="polite">Showing ${typeProducts.length} pieces.</p>
          </div>
        </div>
        <div class="product-grid" data-product-grid data-type="${escapeHtml(type)}" data-type-grid></div>
        <div class="empty-state" data-type-empty hidden>
          <p class="eyebrow">Nothing here yet</p>
          <h3>This path is still growing.</h3>
        </div>
      </section>
    `;

    renderProductGrids();
    initialiseProductGalleries();
    initialiseTypePageFilters(root);
  }

  function initialiseTypePageFilters(root = document) {
    const grid = root.querySelector("[data-type-grid]");
    const sortSelect = root.querySelector("[data-type-sort]");
    const status = root.querySelector("[data-type-filter-status]");
    const empty = root.querySelector("[data-type-empty]");
    if (!grid || !sortSelect) return;

    const cards = [...grid.querySelectorAll("[data-product]")];
    const defaultOrder = new Map(cards.map((card, index) => [card, index]));
    const params = new URLSearchParams(location.search);
    const requestedSort = params.get("sort") || "default";
    sortSelect.value = [...sortSelect.options].some((option) => option.value === requestedSort)
      ? requestedSort
      : "default";

    function cardPrice(card) {
      const price = Number(card.dataset.priceValue);
      return Number.isFinite(price) ? price : null;
    }

    function sortCards() {
      const sorted = [...cards].sort((a, b) => {
        const priceA = cardPrice(a);
        const priceB = cardPrice(b);
        if (sortSelect.value === "price-ascending") {
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceA - priceB || defaultOrder.get(a) - defaultOrder.get(b);
        }
        if (sortSelect.value === "price-descending") {
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceB - priceA || defaultOrder.get(a) - defaultOrder.get(b);
        }
        return defaultOrder.get(a) - defaultOrder.get(b);
      });

      let visible = 0;
      sorted.forEach((card) => {
        const show = sortSelect.value !== "made-to-order" || card.dataset.orderable === "true";
        card.hidden = !show;
        if (show) visible += 1;
      });
      grid.append(...sorted);
      if (status) status.textContent = `Showing ${visible} of ${cards.length} pieces.`;
      if (empty) empty.hidden = visible !== 0;

      const next = new URLSearchParams(location.search);
      sortSelect.value === "default" ? next.delete("sort") : next.set("sort", sortSelect.value);
      history.replaceState(null, "", `${location.pathname}${next.toString() ? `?${next}` : ""}${location.hash}`);
    }

    sortSelect.addEventListener("change", sortCards);
    sortCards();
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
    addConfiguredToCart,
    CONTACT_EMAIL,
  };

  installCartLink();
  installAddToCartDialog();
  renderProductGrids();
  renderProductPage();
  renderProductTypePage();
  initialiseProductGalleries();
  initialiseLightbox();
  initialiseLoreDialog();
  initialiseShopFilters();
  updateCartCount();
  restoreCatalogueScrollWhenReady();

  document.addEventListener("click", (event) => {
    const productLink = event.target.closest("[data-product-link]");
    if (productLink) {
      saveCatalogueReturnState();
      return;
    }

    const loreButton = event.target.closest("[data-lore-open]");
    if (loreButton) {
      openLore(loreButton.dataset.loreOpen, loreButton);
      return;
    }

    const changeButton = event.target.closest("[data-cart-change]");
    if (changeButton) {
      const cartKey = changeButton.dataset.cartChange;
      const delta = Number(changeButton.dataset.cartDelta);
      const item = readCart().find((cartItem) => (cartItem.key || cartItem.id) === cartKey);
      if (item) updateCartItem(cartKey, item.quantity + delta);
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

    const loreZoomButton = event.target.closest("[data-lore-zoom]");
    if (loreZoomButton) {
      adjustLoreScale(Number(loreZoomButton.dataset.loreZoom) * LORE_SCALE_STEP);
      return;
    }

    if (event.target.closest("[data-lightbox-close]")) {
      closeLightbox();
      return;
    }

    if (event.target.closest("[data-lore-close]")) {
      closeLore();
      return;
    }

    if (event.target.closest("[data-cart-confirm-close]")) {
      closeAddToCartDialog();
      return;
    }

    if (event.target.closest("[data-cart-confirm-continue]")) {
      const product = cartConfirmState.product;
      const url = continueShoppingUrl(product);
      closeAddToCartDialog();
      window.location.assign(url);
    }
  });

  document.addEventListener("change", (event) => {
    const form = event.target.closest("[data-product-form]");
    if (form) updateProductPurchaseForm(form);
  });

  document.addEventListener(
    "toggle",
    (event) => {
      if (event.target.matches(".measuring-guide, .type-buying-guide")) {
        event.target.querySelector("summary")?.setAttribute("aria-expanded", String(event.target.open));
      }
    },
    true,
  );

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-product-form]");
    if (!form) return;

    event.preventDefault();
    const product = productById(form.dataset.productId);
    const error = form.querySelector("[data-product-form-error]");
    const addButton = form.querySelector("[data-product-add-button]");
    if (!product) return;

    try {
      const editCartKey = form.dataset.editCartKey || "";
      const quantity = Number(form.dataset.editQuantity || 1) || 1;
      const line = catalog.configuredCartLine({
        productId: product.id,
        quantity,
        selections: productPageSelections(form),
      });
      if (editCartKey) removeCartItem(editCartKey);
      addConfiguredToCart(line);
      updateProductPurchaseForm(form);
      openAddToCartDialog(line, product, addButton, editCartKey ? "updated" : "added");
    } catch (validationError) {
      if (error) error.textContent = validationError.message;
      updateProductPurchaseForm(form);
    }
  });

  document.querySelector("#add-to-cart-dialog")?.addEventListener("click", (event) => {
    if (event.target.id === "add-to-cart-dialog") closeAddToCartDialog();
  });

  document.querySelector("#add-to-cart-dialog")?.addEventListener("close", () => {
    document.documentElement.classList.remove("lightbox-open");
    cartConfirmState.opener?.focus?.();
    cartConfirmState.opener = null;
  });
})();
