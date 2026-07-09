(() => {
  "use strict";

  const products = window.GLOAMWEALD_PRODUCTS || [];
  const collections = window.GLOAMWEALD_COLLECTIONS || {};
  const typeLabels = {
    bracelets: "Bracelet",
    necklaces: "Necklace",
    "wallet-chains": "Wallet chain",
    earrings: "Earrings",
    other: "Other",
  };

  function productMedia(product) {
    if (product.images?.length) {
      const images = product.images
        .map(
          (image, index) => `
            <button
              class="product-photo"
              type="button"
              data-lightbox-open="${product.id}"
              data-image-index="${index}"
              aria-label="Open image ${index + 1} of ${product.images.length} for ${product.name} full-screen"
            >
              <img
                src="${image.src}"
                alt="${image.alt}"
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
              aria-label="Previous ${product.name} photograph"
              disabled
            ><span aria-hidden="true">‹</span></button>
            <button
              class="gallery-arrow gallery-arrow--next"
              type="button"
              data-gallery-nav="1"
              aria-label="Next ${product.name} photograph"
            ><span aria-hidden="true">›</span></button>
          `
          : "";

      return `
        <div class="product-visual product-visual--photo">
          <div
            class="product-gallery"
            tabindex="0"
            data-product-gallery
            aria-label="${product.name} product photographs"
          >
            ${images}
          </div>
          ${controls}
        </div>
      `;
    }

    return `
      <div
        class="product-visual product-visual--${product.visual}"
        role="img"
        aria-label="Photography placeholder for ${product.name}"
      >
        <span>Photography coming soon</span>
        <i aria-hidden="true"></i>
      </div>
    `;
  }

  function productCard(product) {
    const componentTags = product.components
      .map((component) => `<span>${component}</span>`)
      .join("");
    const collection = product.collection ? collections[product.collection] : null;
    const collectionTag = collection
      ? `<a class="product-collection-link" href="${collection.url}">${collection.name}</a>`
      : "";
    const action = product.orderable
      ? `<a class="button" href="mailto:gloamweald@gmail.com?subject=${encodeURIComponent(product.name + " enquiry")}">Enquire to order</a>`
      : `<span class="concept-label">Concept placeholder</span>`;

    return `
      <article
        class="product-card"
        data-product
        data-product-id="${product.id}"
        data-type="${product.type}"
        data-components="${product.components.join(" ")}"
      >
        ${productMedia(product)}
        <div class="product-details">
          <div class="product-tags" aria-label="Product categories">
            <span>${typeLabels[product.type]}</span>
            ${componentTags}
            ${collectionTag}
          </div>
          <h3>${product.name}</h3>
          <p class="price">${product.price}</p>
          <p>${product.description}</p>
          <dl class="product-specs">
            <div><dt>Material</dt><dd>${product.material}</dd></div>
            <div><dt>Status</dt><dd>${product.status}</dd></div>
          </dl>
          ${action}
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
          <span aria-hidden="true">×</span>
          <span class="visually-hidden">Close full-screen image viewer</span>
        </button>
        <div class="lightbox-stage">
          <button
            class="lightbox-arrow lightbox-arrow--previous"
            type="button"
            data-lightbox-nav="-1"
            aria-label="Previous photograph"
          ><span aria-hidden="true">‹</span></button>
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
          ><span aria-hidden="true">›</span></button>
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
    const product = products.find((item) => item.id === productId);
    if (!product?.images?.length) return;

    activeLightboxImages = product.images;
    lightboxTitle.textContent = `${product.name} photographs`;
    lightboxTrack.innerHTML = product.images
      .map(
        (image) => `
          <div class="lightbox-slide">
            <img src="${image.src}" alt="${image.alt}" />
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

  document.addEventListener("click", (event) => {
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
