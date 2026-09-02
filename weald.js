import {
  GLOAMWEALD_COLLECTIONS,
  GLOAMWEALD_PRODUCTS,
  productSlug,
} from "./src/product-catalog.js";
import {
  WORLD_BEGIN_HERE,
  WORLD_COLLECTION_CARDS,
  WORLD_FIELD_NOTES,
  WORLD_HUB_HERO,
  validateWorldContent,
} from "./src/world-content.js";

const WEALD_RETURN_STORAGE_KEY = "gloamweald-weald-return";
const RETURN_STATE_TTL = 1000 * 60 * 60;
const productsById = new Map(GLOAMWEALD_PRODUCTS.map((product) => [product.id, product]));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function productPageHref(product, hash = "") {
  const slug = productSlug(product);
  return `product.html?product=${encodeURIComponent(slug)}${hash}`;
}

function productHasLore(product) {
  return typeof product?.lore === "string" && product.lore.trim().length > 0;
}

function relatedProductsForEntry(entry) {
  const ids = Array.isArray(entry.relatedProductIds)
    ? entry.relatedProductIds
    : entry.relatedProductId
      ? [entry.relatedProductId]
      : [];

  return ids.map((id) => productsById.get(id)).filter(Boolean);
}

function storyProductForEntry(entry) {
  const product = productsById.get(entry.storyProductId || entry.relatedProductId);
  return productHasLore(product) ? product : null;
}

function productThumbnailHtml(product) {
  const image = product.images?.[0];
  const thumbnail = image
    ? `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" />`
    : `<span class="field-note-card__thumbnail-placeholder" aria-hidden="true">No image yet</span>`;

  return `
    <a
      class="field-note-card__product-link"
      href="${escapeHtml(productPageHref(product))}"
      data-product-link
      data-product-id="${escapeHtml(product.id)}"
    >
      <span class="field-note-card__thumbnail">${thumbnail}</span>
      <span class="field-note-card__product-name">${escapeHtml(product.name)}</span>
    </a>
  `;
}

function storyButtonHtml(entry) {
  const product = storyProductForEntry(entry);
  if (!product) return "";

  return `
    <button
      class="lore-button field-note-card__story-button"
      type="button"
      data-lore-open="${escapeHtml(product.id)}"
      aria-label="Read story for ${escapeHtml(product.name)}"
    >
      <span class="lore-button__label" aria-hidden="true">~ LORE ~</span>
      <span class="lore-button__hover" aria-hidden="true">${escapeHtml(entry.storyLabel || "Read the story")}</span>
    </button>
  `;
}

function relationshipHtml(entry) {
  const products = relatedProductsForEntry(entry);
  if (products.length) {
    return `
      <div class="field-note-card__relationship">
        <p class="field-note-card__relationship-title">${escapeHtml(entry.relationship || (products.length > 1 ? "Related products" : "Related product"))}</p>
        <div class="field-note-card__products">
          ${products.map(productThumbnailHtml).join("")}
        </div>
      </div>
    `;
  }

  if (entry.relatedCollectionId) {
    const collection = GLOAMWEALD_COLLECTIONS[entry.relatedCollectionId];
    if (!collection) {
      return `<p class="field-note-card__relationship">${escapeHtml(entry.relationship || "Related collection")}: unavailable</p>`;
    }

    return `
      <p class="field-note-card__relationship">
        ${escapeHtml(entry.relationship || "Related collection")}:
        <a href="${escapeHtml(collection.url)}">${escapeHtml(collection.name)}</a>
      </p>
    `;
  }

  return "";
}

function saveWealdReturnState() {
  try {
    sessionStorage.setItem(
      WEALD_RETURN_STORAGE_KEY,
      JSON.stringify({
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        timestamp: Date.now(),
      }),
    );
  } catch {
    /* Continue without return-state persistence if storage is unavailable. */
  }
}

function restoreWealdScrollWhenReady() {
  let state = null;

  try {
    state = JSON.parse(sessionStorage.getItem(WEALD_RETURN_STORAGE_KEY) || "null");
  } catch {
    state = null;
  }

  if (location.hash !== "#collections" || !state?.timestamp || Date.now() - Number(state.timestamp) > RETURN_STATE_TTL) {
    return;
  }

  try {
    sessionStorage.removeItem(WEALD_RETURN_STORAGE_KEY);
  } catch {
    /* Nothing to clean up if storage is unavailable. */
  }

  window.setTimeout(() => {
    window.scrollTo({
      left: Number(state.scrollX) || 0,
      top: Number(state.scrollY) || 0,
      behavior: "auto",
    });
  }, 80);
}

function renderHero() {
  const hero = document.querySelector("[data-weald-hero]");
  if (!hero) return;

  hero.innerHTML = `
    <div class="weald-hero__copy">
      <p class="eyebrow">${escapeHtml(WORLD_HUB_HERO.eyebrow)}</p>
      <h1>${escapeHtml(WORLD_HUB_HERO.title)}</h1>
      <p>${escapeHtml(WORLD_HUB_HERO.intro)}</p>
      <nav class="weald-jump-nav" aria-label="The Weald sections">
        <a href="#the-world">The World</a>
        <a href="#tales-and-beings">Tales &amp; Beings</a>
        <a href="#collections">Collections</a>
      </nav>
    </div>
    <figure class="weald-hero__image">
      <img src="assets/images/home-page-chainmaille.webp" alt="Close-up of hand-held stainless steel chainmail in low light" />
    </figure>
  `;
}

function renderWorldIntro() {
  const section = document.querySelector("[data-weald-world]");
  if (!section) return;

  section.innerHTML = `
    <div class="section-heading section-heading--compact">
      <div>
        <p class="eyebrow">${escapeHtml(WORLD_BEGIN_HERE.eyebrow)}</p>
        <h2 id="the-world-title">${escapeHtml(WORLD_BEGIN_HERE.title)}</h2>
      </div>
    </div>
    <div class="weald-reading">
      ${WORLD_BEGIN_HERE.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
  `;
}

function renderFieldNotes() {
  const grid = document.querySelector("[data-field-notes]");
  if (!grid) return;

  const visibleNotes = WORLD_FIELD_NOTES.filter((entry) => !entry.hidden);
  grid.innerHTML = visibleNotes
    .map(
      (entry) => `
        <article class="field-note-card">
          <p class="field-note-card__category">${escapeHtml(entry.category)}</p>
          <h3>${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.excerpt)}</p>
          <div class="field-note-card__actions">
            ${relationshipHtml(entry)}
            ${storyButtonHtml(entry)}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderCollections() {
  const grid = document.querySelector("[data-weald-collections]");
  if (!grid) return;

  grid.innerHTML = WORLD_COLLECTION_CARDS.map((card) => {
    const collection = GLOAMWEALD_COLLECTIONS[card.id];
    if (!collection) {
      return `
        <article class="collection-card ${escapeHtml(card.cardClass || "")}">
          <span class="collection-number">${escapeHtml(card.number || "")}</span>
          <span class="collection-name">${escapeHtml(card.title)}</span>
          <span>${escapeHtml(card.excerpt)}</span>
          <strong>Unavailable</strong>
        </article>
      `;
    }

    return `
      <a
        class="collection-card ${escapeHtml(card.cardClass || "")}"
        href="${escapeHtml(collection.url)}"
        data-weald-return-link
      >
        <span class="collection-number">${escapeHtml(card.number || "")}</span>
        <span class="collection-name">${escapeHtml(collection.name || card.title)}</span>
        <span>${escapeHtml(card.excerpt)}</span>
        <strong>${escapeHtml(card.linkLabel || `Enter ${collection.name}`)} <span aria-hidden="true">→</span></strong>
      </a>
    `;
  }).join("");
}

function reportValidationIssues() {
  const issues = validateWorldContent({
    products: GLOAMWEALD_PRODUCTS,
    collections: GLOAMWEALD_COLLECTIONS,
  });

  if (issues.length) {
    console.warn("World content validation issues:", issues);
  }
}

reportValidationIssues();
renderHero();
renderWorldIntro();
renderFieldNotes();
renderCollections();
restoreWealdScrollWhenReady();

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-weald-return-link]")) {
    saveWealdReturnState();
  }
});
