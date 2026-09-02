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

function linkHtml(href, label, className = "text-link") {
  if (!href || !label) return "";
  return `<a class="${escapeHtml(className)}" href="${escapeHtml(href)}">${escapeHtml(label)} <span aria-hidden="true">→</span></a>`;
}

function entryHasValidStoryTarget(entry) {
  if (entry.relatedProductId && !productsById.has(entry.relatedProductId)) return false;
  if (entry.relatedCollectionId && !GLOAMWEALD_COLLECTIONS[entry.relatedCollectionId]) return false;
  return Boolean(entry.storyHref);
}

function renderRelationship(entry) {
  if (entry.relatedProductId) {
    const product = productsById.get(entry.relatedProductId);
    if (!product) {
      return `<p class="field-note-card__relationship">${escapeHtml(entry.relationship || "Related product")}: unavailable</p>`;
    }

    return `
      <p class="field-note-card__relationship">
        ${escapeHtml(entry.relationship || "Related product")}:
        <a href="${escapeHtml(productPageHref(product))}">${escapeHtml(product.name)}</a>
      </p>
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
        <a href="#relics">Relics</a>
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
    .map((entry) => {
      const storyLink = entryHasValidStoryTarget(entry)
        ? linkHtml(entry.storyHref, entry.storyLabel || "Read the field note", "quiet-button")
        : "";

      return `
        <article class="field-note-card">
          <p class="field-note-card__category">${escapeHtml(entry.category)}</p>
          <h3>${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.excerpt)}</p>
          ${renderRelationship(entry)}
          <div class="field-note-card__actions">
            ${storyLink}
          </div>
        </article>
      `;
    })
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
      <a class="collection-card ${escapeHtml(card.cardClass || "")}" href="${escapeHtml(collection.url)}">
        <span class="collection-number">${escapeHtml(card.number || "")}</span>
        <span class="collection-name">${escapeHtml(collection.name || card.title)}</span>
        <span>${escapeHtml(card.excerpt)}</span>
        <strong>${escapeHtml(card.linkLabel || `Enter ${collection.name}`)} <span aria-hidden="true">→</span></strong>
      </a>
    `;
  }).join("");
}

function renderRelics() {
  const list = document.querySelector("[data-weald-relics]");
  if (!list) return;

  const relicEntries = WORLD_FIELD_NOTES.filter(
    (entry) => !entry.hidden && entry.featuredRelic && entry.relatedProductId,
  );

  list.innerHTML = relicEntries
    .map((entry) => {
      const product = productsById.get(entry.relatedProductId);
      if (!product) {
        return `
          <article class="relic-card">
            <p class="eyebrow">${escapeHtml(entry.category)}</p>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.excerpt)}</p>
            <p class="field-note">Linked product is missing from the catalogue.</p>
          </article>
        `;
      }

      return `
        <article class="relic-card">
          <p class="eyebrow">${escapeHtml(entry.category)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(entry.excerpt)}</p>
          <div class="relic-card__actions">
            ${entryHasValidStoryTarget(entry) ? linkHtml(entry.storyHref, "Read the story", "quiet-button") : ""}
            ${linkHtml(productPageHref(product), "View/customise product", "button button--solid")}
          </div>
        </article>
      `;
    })
    .join("");
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
renderRelics();
