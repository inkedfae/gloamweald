/*
  World and lore hub source of truth.

  This file is meant to stay simple and human-editable. It describes the
  editorial structure for weald.html, plus short excerpts and relationships.
  Full product lore remains authoritative on each product object in
  src/product-catalog.js; do not duplicate complete product stories here.

  How to edit this hub:
  - Reorder arrays to change display order.
  - Keep every id unique, lowercase, and stable.
  - Use category values from WORLD_FIELD_NOTE_CATEGORIES.
  - Link a field note to one or more products with relatedProductIds, or to a
    collection with relatedCollectionId.
  - Use storyProductId when "Read the story" should open existing product lore.
  - Use hidden: true to keep an entry in the file without showing it.

  FIELD NOTE TEMPLATE — copy this when adding a similar note
  // {
  //   id: "short-field-note-id",
  //   category: "Being",
  //   title: "Field note title",
  //   excerpt: "A short, explicit excerpt or summary drawn from existing lore.",
  //   storyProductId: "product-id",
  //   storyLabel: "Read the story",
  //   relatedProductIds: ["product-id"],
  //   relatedCollectionId: "",
  //   relationship: "Related product",
  //   hidden: false,
  // },
*/

export const WORLD_FIELD_NOTE_CATEGORIES = Object.freeze([
  "Being",
  "Place",
  "Phenomenon",
  "Omen",
  "Relic",
]);

export const WORLD_HUB_HERO = Object.freeze({
  eyebrow: "The world behind the work",
  title: "Enter the Gloamweald.",
  intro:
    "The Gloamweald is a huge, ancient dark forest, older than the towns and cities that press against its borders. Modern development keeps clearing at the edges, but the forest does not behave like ordinary woodland: strange creatures adapt, spread, and survive in the newly opened places, while the deep wild heart endures beyond certainty.",
});

export const WORLD_BEGIN_HERE = Object.freeze({
  eyebrow: "The World",
  title: "Begin here.",
  paragraphs: Object.freeze([
    "Gloamweald sits somewhere between myth and nature, worked metal and weathered bone, beauty and something slightly uncanny.",
    "In the world behind the work, the weald is a dark, mythical forest: thick and tangled, occupying a shifting space where anything could happen. Some paths are marked, some lights wander, and some warnings arrive before the mind has made sense of them.",
    "People have built close to the forest for a long time. Villages, roads, and bright city edges push against it, clearing what they can. The old depths remain. What leaves them may look like a creature, a relic, an omen, or only a glint of steel beneath a sleeve.",
    "These notes gather the stories already living with Gloamweald pieces and collections. They are not an encyclopedia of the forest; they are signs found at its edge.",
  ]),
});

export const WORLD_FIELD_NOTES = Object.freeze([
  {
    id: "leoma",
    category: "Phenomenon",
    title: "Lēoma",
    excerpt:
      "Wandering lights are sometimes seen between the thick trees, dancing just beyond the path and vanishing whenever pursued. Healers and elders of the old ways are said to coax such light into certain stones.",
    storyProductId: "leoma-amulet",
    storyLabel: "Read the story",
    relatedProductIds: ["leoma-amulet"],
    relatedCollectionId: "",
    relationship: "Related product",
    hidden: false,
  },
  {
    id: "briar-imps",
    category: "Being",
    title: "Briar Imps",
    excerpt:
      "Briar imps nest in the thick undergrowth, where thorn-like horns and twisting tails make them easy to mistake for burrs. A bright scrap may earn safe passage; refusal may wake every thorn along the path.",
    storyProductId: "briar-imp-earrings",
    storyLabel: "Read the story",
    relatedProductIds: ["briar-imp-earrings"],
    relatedCollectionId: "",
    relationship: "Related earrings",
    hidden: false,
  },
  {
    id: "old-iron-waymarkers",
    category: "Omen",
    title: "Old iron waymarkers",
    excerpt:
      "The oldest paths through the Gloamweald were said to be marked by iron rings worked into branches and trunks, each one pointing toward the next before the forest could swallow the way behind you.",
    storyProductId: "waymarker-necklace",
    storyLabel: "Read the story",
    relatedProductIds: ["waymarker-necklace"],
    relatedCollectionId: "",
    relationship: "Related necklace",
    hidden: false,
  },
  {
    id: "the-bone-chain",
    category: "Relic",
    title: "The bone chain",
    excerpt:
      "One tale tells of a maiden who vanished into the Gloamweald at dusk and returned after the first snow carrying a chain of unknown little bones. Generations later, steel chains still remember the shape of that story.",
    storyProductId: "bonelink-wallet-chain",
    storyLabel: "Read the story",
    relatedProductIds: ["bonelink-wallet-chain"],
    relatedCollectionId: "",
    relationship: "Related wallet chain",
    hidden: false,
  },
  {
    id: "placeholder-place",
    category: "Place",
    title: "Placeholder place",
    excerpt:
      "Placeholder field note for testing a place entry connected to more than one product. Replace this with established place lore when ready.",
    storyProductId: "leoma-amulet",
    storyLabel: "Read the story",
    relatedProductIds: ["leoma-amulet", "waymarker-necklace"],
    relatedCollectionId: "",
    relationship: "Related products",
    hidden: false,
  },
]);

export const WORLD_COLLECTION_CARDS = Object.freeze([
  {
    id: "morrigan",
    number: "I",
    title: "The Morrigan",
    excerpt: "Black wings, threefold omens, and the hush before consequence.",
    linkLabel: "Enter The Morrigan",
    cardClass: "collection-card--morrigan",
  },
  {
    id: "tenebris",
    number: "II",
    title: "Tenebris",
    excerpt: "Relics carried through a city where the lamps have gone low.",
    linkLabel: "Enter Tenebris",
    cardClass: "collection-card--tenebris",
  },
  {
    id: "wyrms-hoard",
    number: "III",
    title: "The Wyrm's Hoard",
    excerpt: "Unearthed treasure, guarded fragments, and old things with teeth.",
    linkLabel: "Enter the Hoard",
    cardClass: "collection-card--wyrm",
  },
]);

export function validateWorldContent({ products = [], collections = {} } = {}) {
  const issues = [];
  const ids = new Set();
  const productIds = new Set(products.map((product) => product.id));
  const collectionIds = new Set(Object.keys(collections));
  const categories = new Set(WORLD_FIELD_NOTE_CATEGORIES);

  WORLD_FIELD_NOTES.forEach((entry) => {
    const label = entry?.id || entry?.title || "Unnamed field note";

    if (!entry?.id) issues.push("A field note is missing an id.");
    if (ids.has(entry.id)) issues.push(`Duplicate field note id: ${entry.id}`);
    ids.add(entry.id);

    if (!entry?.title) issues.push(`${label} is missing a title.`);
    if (!categories.has(entry?.category)) issues.push(`${label} uses unknown category ${entry?.category}.`);
    if (!entry?.excerpt) issues.push(`${label} is missing an excerpt.`);
    if (entry?.storyProductId) {
      const product = products.find((item) => item.id === entry.storyProductId);
      if (!product) {
        issues.push(`${label} references missing story product ${entry.storyProductId}.`);
      } else if (typeof product.lore !== "string" || !product.lore.trim()) {
        issues.push(`${label} uses story product ${entry.storyProductId}, which has no lore.`);
      }
    }

    if (entry?.relatedProductId && !productIds.has(entry.relatedProductId)) {
      issues.push(`${label} references missing product ${entry.relatedProductId}.`);
    }

    if (entry?.relatedProductIds && !Array.isArray(entry.relatedProductIds)) {
      issues.push(`${label} relatedProductIds must be an array.`);
    }

    if (Array.isArray(entry?.relatedProductIds)) {
      entry.relatedProductIds.forEach((productId) => {
        if (!productIds.has(productId)) issues.push(`${label} references missing product ${productId}.`);
      });
    }

    if (entry?.relatedCollectionId && !collectionIds.has(entry.relatedCollectionId)) {
      issues.push(`${label} references missing collection ${entry.relatedCollectionId}.`);
    }
  });

  const collectionCardIds = new Set();
  WORLD_COLLECTION_CARDS.forEach((card) => {
    const label = card?.id || card?.title || "Unnamed collection card";

    if (!card?.id) issues.push("A collection card is missing an id.");
    if (collectionCardIds.has(card.id)) issues.push(`Duplicate collection card id: ${card.id}`);
    collectionCardIds.add(card.id);

    if (!collectionIds.has(card?.id)) issues.push(`${label} references missing collection ${card?.id}.`);
    if (!card?.title) issues.push(`${label} is missing a title.`);
    if (!card?.excerpt) issues.push(`${label} is missing an excerpt.`);
  });

  return issues;
}
