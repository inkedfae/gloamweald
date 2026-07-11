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
      amount: 75,
      currency: CATALOG_CURRENCY,
    },
    description: "A spinal elf-weave bracelet: flexible, textured, and ideal for every-day wear.",
    material: "Stainless steel",
    status: "Available by enquiry",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/dark-elf-bracelet-primary.jpg",
        alt: "Dark Elf spinal elf-weave bracelet worn around a tattooed wrist",
      },
      {
        src: "assets/images/dark-elf-bracelet-underneath.jpg",
        alt: "Underside of the Dark Elf bracelet beside a blue prop stone",
      },
    ],
  },
  {
    id: "small-half-persian-necklace",
    name: "Small Half-Persian Necklace",
    type: "necklaces",
    components: [],
    collection: "classics",
    price: {
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Price on enquiry",
    },
    description: "A slim 7 mm width half-Persian chain: understated, close-wearing, and perfect for daily wear and layering.",
    material: "Stainless steel",
    status: "Available by enquiry",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/half-persian-necklace.jpg",
        alt: "Small half-Persian stainless steel necklace worn close around a tattooed neck",
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
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Price on enquiry",
    },
    description: "Thick Byzantine weave joining weighty dual links in a bone-like repeating pattern.",
    material: "Stainless steel",
    status: "Available by enquiry",
    orderable: true,
    visual: "bone",
  },
  {
    id: "half-persian-wallet-chain-pendant",
    name: "Half-Persian Wallet Chain with Charm",
    type: "wallet-chains",
    components: [],
    collection: null,
    price: {
      amount: 85,
      currency: CATALOG_CURRENCY,
    },
    description: "A half-Persian wallet chain with a small charm on a Byzantine chain.",
    material: "Stainless steel",
    status: "Available by enquiry",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/half-persian-wallet-chain-star.jpg",
        alt: "Half-Persian wallet chain with a small cross-like star charm on a small Byzantine chain ",
      },
    ],
  },
  {
    id: "omen-choker",
    name: "Omen Choker",
    type: "necklaces",
    components: ["bone"],
    collection: "morrigan",
    price: {
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Not yet released",
    },
    description: "A close-set chain with pale bone details arranged in a quiet threefold rhythm.",
    material: "Stainless steel · bone",
    status: "Collection concept",
    orderable: false,
    visual: "morrigan",
  },
  {
    id: "blackwing-earrings",
    name: "Blackwing Earrings",
    type: "earrings",
    components: ["gemstone"],
    collection: "morrigan",
    price: {
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Not yet released",
    },
    description: "Long chain drops with dark gemstone points, made to shift like folded wings.",
    material: "Stainless steel · gemstone",
    status: "Collection concept",
    orderable: false,
    visual: "morrigan",
  },
  {
    id: "veilchain-bracelet",
    name: "Veilchain Bracelet",
    type: "bracelets",
    components: ["gemstone"],
    collection: "tenebris",
    price: {
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Not yet released",
    },
    description: "Fine dark chain gathered around a low-lit gemstone, like a lamp behind a veil.",
    material: "Stainless steel · gemstone",
    status: "Collection concept",
    orderable: false,
    visual: "tenebris",
  },
  {
    id: "night-relic-pendant",
    name: "Night Relic Pendant",
    type: "necklaces",
    components: ["fossil"],
    collection: "tenebris",
    price: {
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Not yet released",
    },
    description: "A small fossil fragment held inside a shadowed frame of interlinked steel.",
    material: "Stainless steel · fossil",
    status: "Collection concept",
    orderable: false,
    visual: "tenebris",
  },
  {
    id: "hoardkeeper-collar",
    name: "Hoardkeeper Collar",
    type: "necklaces",
    components: ["gemstone", "bone"],
    collection: "wyrms-hoard",
    price: {
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Not yet released",
    },
    description: "A substantial collar carrying mismatched treasures gathered into one guarded piece.",
    material: "Stainless steel · gemstone · bone",
    status: "Collection concept",
    orderable: false,
    visual: "wyrm",
  },
  {
    id: "buried-scale-chain",
    name: "Buried Scale Chain",
    type: "other",
    components: ["fossil"],
    collection: "wyrms-hoard",
    price: {
      amount: null,
      currency: CATALOG_CURRENCY,
      label: "Not yet released",
    },
    description: "Layered steel and a fossil centrepiece suggesting something old beneath the earth.",
    material: "Stainless steel · fossil",
    status: "Collection concept",
    orderable: false,
    visual: "wyrm",
  },
    {
    id: "test-product",
    name: "Test Item",
    type: "bracelets",
    components: ["bone", "fossil"],
    collection: "classics",
    price: {
      amount: 2,
      currency: CATALOG_CURRENCY,
    },
    description: "Short product description here.",
    material: "Stainless steel",
    status: "Available",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/new-product-image.jpg",
        alt: "Description of the product image",
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
  if (amount !== null) return `$${amount} ${product.price?.currency || CATALOG_CURRENCY}`;
  return product?.price?.label || "Price on enquiry";
}

export function checkoutProductById(id) {
  const product = productById(id);
  const amount = productPriceAmount(product);
  if (!product?.orderable || amount === null) return null;

  return {
    id: product.id,
    name: product.name,
    unitAmount: amount,
  };
}
