import {
  GLOAMWEALD_COLLECTIONS,
  GLOAMWEALD_PRODUCTS,
  productSlug,
} from "./src/product-catalog.js";
import {
  WORLD_BEGIN_HERE,
  WORLD_COLLECTION_CARDS,
  WORLD_HUB_HERO,
  WORLD_LORE_FROM_EDGE,
  validateWorldContent,
} from "./src/world-content.js";

const WEALD_RETURN_STORAGE_KEY = "gloamweald-weald-return";
const RETURN_STATE_TTL = 1000 * 60 * 60;
const WORLD_BOOK_PARAGRAPH_BREAK = "\n\n";
const WORLD_BOOK_RESIZE_DELAY = 120;
const productsById = new Map(GLOAMWEALD_PRODUCTS.map((product) => [product.id, product]));
let worldBookPages = buildWorldBookPages(WORLD_BEGIN_HERE.paragraphs);
let worldBookSpreadStart = 0;
let worldBookResizeTimer = null;

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

function buildWorldBookPages(paragraphs) {
  const copy = paragraphs
    .map((paragraph) => String(paragraph || "").trim())
    .filter(Boolean)
    .join(WORLD_BOOK_PARAGRAPH_BREAK);
  return copy ? [copy] : [""];
}

function paginateWorldBookText(copy, measureCopy) {
  const pages = [];
  let remainingCopy = String(copy || "").trim();

  while (remainingCopy) {
    const pageBreak = fittedWorldBookPageBreak(remainingCopy, measureCopy);
    pages.push(cleanWorldBookPage(remainingCopy.slice(0, pageBreak)));
    remainingCopy = cleanWorldBookPage(remainingCopy.slice(pageBreak));
  }

  return pages.length ? pages : [""];
}

function fittedWorldBookPageBreak(copy, measureCopy) {
  if (!measureCopy || textFitsInBookPage(copy, measureCopy)) return copy.length;

  let low = 1;
  let high = copy.length;
  let bestFit = 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (textFitsInBookPage(copy.slice(0, middle), measureCopy)) {
      bestFit = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  let pageBreak = readableWorldBookBreak(copy, bestFit);
  while (pageBreak > 1 && !textFitsInBookPage(copy.slice(0, pageBreak), measureCopy)) {
    pageBreak = readableWorldBookBreak(copy, pageBreak - 1);
  }

  return Math.max(1, pageBreak);
}

function textFitsInBookPage(copy, measureCopy) {
  measureCopy.textContent = cleanWorldBookPage(copy);
  return measureCopy.scrollHeight <= measureCopy.clientHeight + 1;
}

function readableWorldBookBreak(copy, maxLength) {
  if (maxLength >= copy.length) return copy.length;

  for (let index = Math.max(0, maxLength - 1); index > 0; index -= 1) {
    if (/\s/.test(copy[index] || "")) return index + 1;
  }

  return maxLength;
}

function cleanWorldBookPage(copy) {
  return String(copy || "").trim();
}

function lastWorldBookSpreadStart() {
  if (worldBookPages.length <= 2) return 0;
  return worldBookPages.length % 2 === 0 ? worldBookPages.length - 2 : worldBookPages.length - 1;
}

function renderWorldBookPage(page, pageIndex, side) {
  if (page == null) {
    return `
      <div class="weald-book__page weald-book__page--blank" aria-hidden="true">
        <span class="weald-book__number">&nbsp;</span>
      </div>
    `;
  }

  const turnDirection = side === "left" ? -1 : 1;
  const disabled =
    (turnDirection < 0 && worldBookSpreadStart === 0) ||
    (turnDirection > 0 && worldBookSpreadStart >= lastWorldBookSpreadStart());
  const label = turnDirection < 0 ? "Turn to previous pages" : "Turn to next pages";

  return `
    <button
      type="button"
      class="weald-book__page weald-book__page--${side}"
      data-weald-book-turn="${turnDirection}"
      aria-label="${escapeHtml(label)}"
      ${disabled ? "disabled" : ""}
    >
      <span class="weald-book__copy">${escapeHtml(page)}</span>
      <span class="weald-book__number">${pageIndex + 1}/${worldBookPages.length}</span>
    </button>
  `;
}

function renderWorldBookSpread() {
  const spread = document.querySelector("[data-weald-book-spread]");
  if (!spread) return;

  spread.innerHTML = `
    ${renderWorldBookPage(worldBookPages[worldBookSpreadStart], worldBookSpreadStart, "left")}
    ${renderWorldBookPage(worldBookPages[worldBookSpreadStart + 1], worldBookSpreadStart + 1, "right")}
  `;
}

function createWorldBookMeasureCopy(spread) {
  spread.innerHTML = `
    <button
      type="button"
      class="weald-book__page weald-book__page--left weald-book__page--measure"
      tabindex="-1"
      disabled
      aria-hidden="true"
    >
      <span class="weald-book__copy" data-world-book-measure></span>
      <span class="weald-book__number">99/99</span>
    </button>
    <button
      type="button"
      class="weald-book__page weald-book__page--right weald-book__page--measure"
      tabindex="-1"
      disabled
      aria-hidden="true"
    >
      <span class="weald-book__copy"></span>
      <span class="weald-book__number">99/99</span>
    </button>
  `;

  return spread.querySelector("[data-world-book-measure]");
}

function paginateAndRenderWorldBook() {
  const spread = document.querySelector("[data-weald-book-spread]");
  if (!spread) return;

  const measureCopy = createWorldBookMeasureCopy(spread);
  const sourcePages = buildWorldBookPages(WORLD_BEGIN_HERE.paragraphs);
  worldBookPages = paginateWorldBookText(sourcePages.join(WORLD_BOOK_PARAGRAPH_BREAK), measureCopy);
  worldBookSpreadStart = Math.min(worldBookSpreadStart, lastWorldBookSpreadStart());
  renderWorldBookSpread();
}

function queueWorldBookPagination() {
  window.clearTimeout(worldBookResizeTimer);
  worldBookResizeTimer = window.setTimeout(paginateAndRenderWorldBook, WORLD_BOOK_RESIZE_DELAY);
}

function turnWorldBook(direction) {
  const nextSpreadStart = worldBookSpreadStart + (direction > 0 ? 2 : -2);
  worldBookSpreadStart = Math.min(Math.max(nextSpreadStart, 0), lastWorldBookSpreadStart());
  renderWorldBookSpread();
}

function targetForHash(hash) {
  if (!hash?.startsWith("#") || hash.length <= 1) return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
}

function scrollTargetToTop(target, behavior = "smooth") {
  if (!target) return;

  window.scrollTo({
    left: window.scrollX,
    top: target.getBoundingClientRect().top + window.scrollY,
    behavior,
  });
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

function productTextLinkHtml(product) {
  return `
    <a
      class="tale-card__product-link"
      href="${escapeHtml(productPageHref(product))}"
      data-product-link
      data-product-id="${escapeHtml(product.id)}"
    >${escapeHtml(product.name)}</a>
  `;
}

function relatedProductIdsAttribute(entry) {
  const ids = relatedProductsForEntry(entry).map((product) => product.id);
  return ids.length ? ` data-lore-related-products="${escapeHtml(ids.join(","))}"` : "";
}

function relationshipHtml(entry) {
  const products = relatedProductsForEntry(entry);
  if (products.length) {
    return `
      <div class="tale-card__relationship">
        <p class="tale-card__relationship-title">Related products</p>
        <div class="tale-card__product-links">
          ${products.map(productTextLinkHtml).join("")}
        </div>
      </div>
    `;
  }

  if (entry.relatedCollectionId) {
    const collection = GLOAMWEALD_COLLECTIONS[entry.relatedCollectionId];
    if (!collection) {
      return `<p class="tale-card__relationship">${escapeHtml(entry.relationship || "Related collection")}: unavailable</p>`;
    }

    return `
      <p class="tale-card__relationship">
        ${escapeHtml(entry.relationship || "Related collection")}:
        <a href="${escapeHtml(collection.url)}" data-lore-card-link>${escapeHtml(collection.name)}</a>
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

  worldBookSpreadStart = 0;
  section.innerHTML = `
    <div class="section-heading section-heading--compact">
      <div>
        <p class="eyebrow">${escapeHtml(WORLD_BEGIN_HERE.eyebrow)}</p>
        <h2 id="the-world-title">${escapeHtml(WORLD_BEGIN_HERE.title)}</h2>
      </div>
    </div>
    <div class="weald-reading weald-book" aria-label="The World book">
      <p class="weald-book__hint">Click the right page to turn forward, or the left page to turn back.</p>
      <div class="weald-book__spread" data-weald-book-spread></div>
    </div>
  `;
  paginateAndRenderWorldBook();
}

function renderLoreFromEdge() {
  const grid = document.querySelector("[data-lore-from-edge]");
  if (!grid) return;

  const visibleEntries = WORLD_LORE_FROM_EDGE.filter((entry) => !entry.hidden);
  grid.innerHTML = visibleEntries
    .map(
      (entry) => {
        const storyProduct = storyProductForEntry(entry);
        const cardAttributes = storyProduct
          ? ` role="button" tabindex="0" data-lore-open="${escapeHtml(storyProduct.id)}"${relatedProductIdsAttribute(entry)} aria-label="Read lore for ${escapeHtml(entry.title)}"`
          : "";

        return `
        <article class="tale-card${storyProduct ? " tale-card--interactive" : ""}"${cardAttributes}>
          <p class="tale-card__category">${escapeHtml(entry.category)}</p>
          <h3>${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.excerpt)}</p>
          <div class="tale-card__actions">
            ${relationshipHtml(entry)}
          </div>
        </article>
      `;
      },
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
renderLoreFromEdge();
renderCollections();
restoreWealdScrollWhenReady();

document.addEventListener("click", (event) => {
  const pageTurn = event.target.closest("[data-weald-book-turn]");
  if (pageTurn) {
    turnWorldBook(Number(pageTurn.dataset.wealdBookTurn));
    return;
  }

  const sectionLink = event.target.closest(".weald-jump-nav a[href^='#']");
  if (sectionLink) {
    const target = targetForHash(sectionLink.hash);
    if (target) {
      event.preventDefault();
      scrollTargetToTop(target);

      try {
        history.pushState(null, "", `${location.pathname}${location.search}${sectionLink.hash}`);
      } catch {
        /* Keep the scroll behavior even if history cannot be updated. */
      }
    }
    return;
  }

  if (event.target.closest("[data-weald-return-link]")) {
    saveWealdReturnState();
  }
});

window.addEventListener("resize", queueWorldBookPagination);
