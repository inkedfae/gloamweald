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
    collection: "classics",
    price: {
      amount: 75,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A spinal Elf weave creates a flexible bracelet with a raised central ridge and intricate texture. Dark and distinctive, it resembles something shaped around an ancient spine.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
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
      amount: 80,
      currency: CATALOG_CURRENCY,
    },
    description:
      "The classic Half Persian weave creates a dense, flexible bracelet that drapes comfortably around the wrist. Its flowing pattern catches the light with every movement, balancing simplicity with quiet strength.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
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
    id: "vertebrae-bracelet",
    name: "Vertebrae Bracelet",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 90,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A distinctive raised weave with a repeating spinal pattern that creates depth and texture. Bold without being bulky, it echoes the strength and resilience of bone.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
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
    collection: "classics",
    price: {
      amount: 90,
      currency: CATALOG_CURRENCY,
    },
    description:
      "This intricate Celtic-inspired weave has an elegant balance of strength and detail. If you look closely, it may seem to be looking back at you, watching over you with quiet vigilance.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
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
      amount: 110,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A tightly woven sheet of European 4-in-1 maille with a dense, armour-inspired texture. Small rings create a refined pattern that recalls the close-linked mail once worn beneath cloaks and plate.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-european-cuff-6mm.jpg",
        alt: "Dense European 4-in-1 stainless steel cuff made with 6 mm rings",
      },
    ],
  },

  {
    id: "european-4-in-1-cuff-7mm",
    name: "European 4-in-1 Cuff — 7 mm",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 100,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A balanced European 4-in-1 weave with a little more openness and flexibility. As light passes through the larger rings, the repeating geometry becomes part of the design itself.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-european-cuff-7mm.jpg",
        alt: "European 4-in-1 stainless steel cuff made with 7 mm rings",
      },
    ],
  },

  {
    id: "european-4-in-1-cuff-8mm",
    name: "European 4-in-1 Cuff — 8 mm",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 90,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A bold, open European 4-in-1 weave with a lighter feel and unmistakable chainmail character. Larger rings reveal the weave in its simplest form, where strength comes from the links working together.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/REPLACE-ME-european-cuff-8mm.jpg",
        alt: "Open European 4-in-1 stainless steel cuff made with 8 mm rings",
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
      amount: 130,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A slim Half Persian chain with an understated, close-wearing profile. Its narrow flowing pattern sits comfortably against the body and layers easily with other necklaces.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
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
      amount: 170,
      currency: CATALOG_CURRENCY,
    },
    description:
      "The classic Full Persian weave creates a dense, fluid chain with a substantial feel. Smooth and weighty, it settles naturally against the body, equally at home worn alone or with a pendant.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
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
    components: [],
    collection: "classics",
    price: {
      amount: 180,
      currency: CATALOG_CURRENCY,
    },
    description:
      "Byzantine weave is interrupted by oversized rings, creating a steady rhythm along the chain. Like weathered markers along an old forest path, each larger link quietly draws the eye onward.",
    material: "316 stainless steel · stainless steel clasp",
    status: "Available by enquiry",
    orderable: true,
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
    collection: "classics",
    price: {
      amount: 110,
      currency: CATALOG_CURRENCY,
    },
    description:
      "Thick Byzantine sections join weighty double links in a repeating, bone-like pattern. Its articulated structure brings the suggestion of a spine to a substantial everyday chain.",
    material: "316 stainless steel · stainless steel hardware",
    status: "Available by enquiry",
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
    collection: "classics",
    price: {
      amount: 85,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A flowing Half Persian wallet chain finished with a small charm suspended from Byzantine links. The fine hanging detail moves freely beneath the heavier main chain.",
    material: "316 stainless steel · stainless steel hardware",
    status: "Available by enquiry",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/half-persian-wallet-chain-star.jpg",
        alt: "Half Persian wallet chain with a small cross-like star charm suspended from Byzantine links",
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
