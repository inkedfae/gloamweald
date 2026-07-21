export const CATALOG_CURRENCY = "AUD";

export const GLOAMWEALD_COLLECTIONS = Object.freeze({
  classics: {
    name: "Classics",
    url: "collection-classics.html",
  },
  morrigan: {
    name: "The Morrigan",
    url: "collection-morrigan.html",
  },
  tenebris: {
    name: "Tenebris",
    url: "collection-tenebris.html",
  },
  "wyrms-hoard": {
    name: "The Wyrm's Hoard",
    url: "collection-wyrms-hoard.html",
  },
});

export const GLOAMWEALD_PRODUCTS = Object.freeze([
  {
    id: "dark-elf-bracelet",
    name: "Dark Elf Bracelet",
    type: "bracelets",
    components: [],
    collection: null,
    price: {
      amount: 90,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A spinal Elf weave creates a flexible bracelet with a raised central ridge and intricate texture. Dark and distinctive, it resembles something shaped around an ancient spine. It fastens with a substantial ring clasp that can be worn as a centrepiece or turned discreetly beneath the wrist.",
    material: "Stainless steel",
    clasp: "Ring clasp",
    dimensions: "Custom length x 13mm x 9mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/dark-elf-bracelet-primary.jpg",
        alt: "Dark Elf spinal Elf-weave bracelet worn around a tattooed wrist",
      },
      {
        src: "assets/images/dark-elf-bracelet-underneath.jpg",
        alt: "Underside of the Dark Elf bracelet beside a blue prop stone",
      },
    ],
  },

  {
    id: "half-persian-bracelet",
    name: "Half Persian Bracelet",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 45,
      currency: CATALOG_CURRENCY,
    },
    description:
      "The classic Half Persian weave creates a dense, flexible bracelet that drapes comfortably around the wrist. Its flowing pattern catches the light with every movement, balancing simplicity with quiet strength. ",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "Custom length x 8mm x 4mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-half-persian-bracelet.jpg",
        alt: "Half Persian stainless steel bracelet",
      },
    ],
  },
  {
    id: "leoma-band",
    name: "Lēoma Band",
    type: "bracelets",
    components: ["gemstone"],
    collection: null,
    price: {
      amount: 90,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A tightly woven Jens Pind Linkage (JPL) chain creates a firm, structured band with a dense, cord-like feel. At its centre, a sphere of misty grey labradorite reveals flashes of blue and green at it turns through the light.",
    lore:
      "Wandering lights are sometimes seen between the trees of the Gloamweald, dancing just beyond the path and vanishing whenever they are pursued. Old makers learned that one could be coaxed gently into certain stones, where it would remain hidden and safe. Only at the right angle does the captive light reveal itself. Worn close to the skin, it is said to ward away the deeper darkness that watches from beneath the trees.",
    material: "Stainless steel · labradorite",
    clasp: "Lobster clasp",
    dimensions: "Custom length x 5mm x 5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/leoma-band-primary.jpg",
        alt: "Lēoma Band worn on the wrist with a vivid blue-flashing labradorite centrepiece",
      },
      {
        src: "assets/images/leoma-band-detail.jpg",
        alt: "Lēoma Band with a tightly woven stainless steel JPL chain and central labradorite bead",
      },
    ],
  },
  {
    id: "vertebrae-bracelet",
    name: "Vertebrae Bracelet",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 48,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A distinctive raised weave with a repeating spinal pattern that creates depth and texture. Bold without being bulky, it echoes the strength and resilience of bone.",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "Custom length x 12mm x 3.5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-vertebrae-bracelet.jpg",
        alt: "Vertebrae-weave stainless steel bracelet",
      },
    ],
  },

  {
    id: "celtic-visions-bracelet",
    name: "Celtic Visions Bracelet",
    type: "bracelets",
    components: [],
    collection: null,
    price: {
      amount: 75,
      currency: CATALOG_CURRENCY,
    },
    description:
      "This intricate Celtic-inspired weave has an elegant balance of strength and detail. If you look closely, it may seem to be looking back at you, watching over you with quiet vigilance.",
    material: "Stainless steel",
    clasp: "Toggle bar",
    dimensions: "Custom length x mm x mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-celtic-visions-bracelet.jpg",
        alt: "Celtic Visions stainless steel bracelet",
      },
    ],
  },

  {
    id: "european-4-in-1-cuff-6mm",
    name: "European 4-in-1 Cuff — 6 mm",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 60,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A tightly woven sheet of European 4-in-1 maille with a dense, armour-inspired texture. Small rings create a refined pattern that recalls the close-linked mail once worn beneath cloaks and plate.",
    material: "Stainless steel",
    clasp: "Slide lock",
    dimensions: "Custom length x 24mm x 3.5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-european-cuff-6mm.jpg",
        alt: "Dense European 4-in-1 stainless steel cuff made with 6mm rings",
      },
    ],
  },
  {
    id: "small-half-persian-necklace",
    name: "Small Half Persian Necklace",
    type: "necklaces",
    components: [],
    collection: "classics",
    price: {
      amount: 100,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A slim Half Persian chain with an understated, close-wearing profile. Its narrow flowing pattern sits comfortably against the body and layers easily with other necklaces.",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "470mm x 6mm x 3.5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/half-persian-necklace.jpg",
        alt: "Small Half Persian stainless steel necklace worn close around a tattooed neck",
      },
    ],
  },

  {
    id: "full-persian-necklace",
    name: "Full Persian Necklace",
    type: "necklaces",
    components: [],
    collection: "classics",
    price: {
      amount: 155,
      currency: CATALOG_CURRENCY,
    },
    description:
      "The classic Full Persian weave creates a dense, fluid chain with a substantial feel. Smooth and weighty, it settles naturally against the body, equally at home worn alone or with a pendant.",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "600mm x 8mm x 8mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-full-persian-necklace.jpg",
        alt: "Full Persian stainless steel necklace",
      },
    ],
  },

  {
    id: "waymarker-necklace",
    name: "Waymarker Necklace",
    type: "necklaces",
    components: ["gemstone"],
    collection: null,
    price: {
      amount: null,
      label: "Coming soon",
      currency: CATALOG_CURRENCY,
    },
    description:
      "Byzantine weave interrupted by thick rings, creating a steady rhythm along the chain. Like weathered markers along an old forest path, each link leads to a tapered point - a map for forgotten places, featuring a larvikite gemstone to keep you to the path.",
    lore:
      "The oldest paths through the Gloamweald were never marked with signs. Travellers instead followed rings of iron hung from branches, each one pointing towards the next before the forest swallowed it from view. A dark stone was carried at the journey's end, not to prevent its bearer from becoming lost, but to ensure that some path would always lead them onward.",
    material: "Stainless steel · larvikite",
    clasp: "Lobster clasp",
    dimensions: "Custom length x mm x mm",
    status: "Coming soon",
    orderable: false,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-waymarker-necklace.jpg",
        alt: "Waymarker necklace combining Byzantine weave with oversized linking rings",
      },
    ],
  },

  {
    id: "bonelink-wallet-chain",
    name: "Bonelink Wallet Chain",
    type: "wallet-chains",
    components: [],
    collection: null,
    price: {
      amount: 95,
      currency: CATALOG_CURRENCY,
    },
    description:
      "Thick Byzantine sections join weighty double links in a repeating, bone-like pattern. Its thick, articulated structure brings the imagery of a chain of bones to a substantial everyday piece.",
    lore:
      "No one agrees on what first left the bones behind. Some say it was a beast too large to pass between the trees; others insist the chain was assembled from relics found one by one along an overgrown path. Whatever their origin, the links are carried as a reminder: even what is buried may endure, joined together long after its name has been forgotten.",
    material: "Stainless steel",
    clasp: "Carabiner",
    dimensions: "638mm x 12mm x 12mm",
    status: "Available - In stock",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-bonelink-wallet-chain.jpg",
        alt: "Bonelink stainless steel wallet chain with repeating bone-like sections",
      },
    ],
  },

  {
    id: "half-persian-wallet-chain-pendant",
    name: "Half Persian Wallet Chain with Charm",
    type: "wallet-chains",
    components: [],
    collection: null,
    price: {
      amount: 79,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A flowing Half Persian wallet chain finished with a small charm suspended from Byzantine links. The fine hanging detail moves freely beneath the heavier main chain.",
    material: "Stainless steel",
    clasp: "Carabiner",
    dimensions: "620mm x 15mm x 8mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/half-persian-wallet-chain-star.jpg",
        alt: "Half Persian wallet chain with a small cross-like star charm suspended from Byzantine links",
      },
    ],
  },
  {
    id: "briar-imp-earrings",
    name: "Briar Imp Earrings",
    type: "earrings",
    components: [],
    collection: null,
    price: {
      amount: null,
      label: "Coming soon",
      currency: CATALOG_CURRENCY,
    },
    description:
      "Compact knots of interlinked stainless steel are finished with polished, outward-facing spikes. The upper spikes form a horned silhouette, the rings linked to allow each earring to shift and catch the light.",
    lore:
      "Briar imps make their nests where the undergrowth grows too thick for larger creatures to follow. Their horns resemble thorns, their bodies curl into knots, and they are easily mistaken for burrs caught among the branches. They are troublesome little things, but not entirely cruel. Leave one a bright scrap of metal and it may guard your path. Refuse, and it may ensure that every briar finds your sleeve.",
    material: "Stainless steel",
    clasp: "Earring",
    dimensions: "mm x mm x mm",
    status: "Coming soon",
    orderable: false,
    visual: "classic",
    images: [
      {
        src: "assets/images/briar-imp-earrings-primary.jpg",
        alt: "Pair of Briar Imp stainless steel earrings with horn-like polished spikes",
      },
      {
        src: "assets/images/briar-imp-earrings-side.jpg",
        alt: "Side view of a Briar Imp earring showing its interlinked construction and outward-facing spikes",
      },
      {
        src: "assets/images/briar-imp-earrings-worn.jpg",
        alt: "Briar Imp stainless steel earring worn on an ear",
      },
    ],
  },
]);

export function productById(id) {
  return GLOAMWEALD_PRODUCTS.find((product) => product.id === id) || null;
}

export function productPriceAmount(product) {
  const amount = product?.price?.amount;
  return Number.isFinite(amount) ? amount : null;
}

export function productDisplayPrice(product) {
  const amount = productPriceAmount(product);

  if (amount !== null) {
    return `$${amount} ${product.price?.currency || CATALOG_CURRENCY}`;
  }

  return product?.price?.label || "Price on enquiry";
}

export function checkoutProductById(id) {
  const product = productById(id);
  const amount = productPriceAmount(product);

  if (!product?.orderable || amount === null) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    unitAmount: amount,
  };
}
