/*
  Product catalogue source of truth.

  To add or edit a product:
  - Keep id and slug unique, lowercase, and URL-safe.
  - Set price.amount for purchasable products, or price.label for enquiry/coming soon.
  - Add images as { src, alt } objects.
  - Add lore only when a product needs story text.
  - Enable customisation only for options that can genuinely be made.
  - Change clasp prices globally in CLASP_OPTIONS, then allow compatible IDs per product.
  - Change bracelet length surcharges in helper ranges.
  - Change extender length choices in STANDARD_EXTENDER_OPTIONS.
*/

export const CATALOG_CURRENCY = "AUD";

export const CLASP_OPTIONS = Object.freeze({
  lobster: {
    id: "lobster",
    name: "Lobster clasp",
    priceDelta: 1,
    image: "",
    dimensions: "Measurement to be added",
    supportsExtender: true,
    description: "A compact, conventional jewellery clasp.",
  },
  "ring-clasp": {
    id: "ring-clasp",
    name: "Ring clasp",
    priceDelta: 0,
    image: "",
    dimensions: "Measurement to be added",
    supportsExtender: true,
    description: "A ring-style closure used as the included clasp on selected bracelets.",
  },
  toggle: {
    id: "toggle",
    name: "Toggle clasp",
    priceDelta: 3,
    image: "",
    dimensions: "Measurement to be added",
    supportsExtender: true,
    description: "A decorative ring-and-bar closure.",
  },
  "small-carabiner": {
    id: "small-carabiner",
    name: "Small carabiner",
    priceDelta: 3,
    image: "",
    dimensions: "Measurement to be added",
    supportsExtender: true,
    description: "A sturdy clip with a compact profile.",
  },
  "medium-carabiner": {
    id: "medium-carabiner",
    name: "Medium carabiner",
    priceDelta: 3,
    image: "",
    dimensions: "Measurement to be added",
    supportsExtender: true,
    description: "A stronger visible clip suited to heavier pieces.",
  },
  "large-carabiner": {
    id: "large-carabiner",
    name: "Large carabiner",
    priceDelta: 3,
    image: "",
    dimensions: "Measurement to be added",
    supportsExtender: true,
    description: "A bolder clip for substantial pieces.",
  },
  "slide-lock": {
    id: "slide-lock",
    name: "Slide-lock clasp",
    priceDelta: 3,
    image: "",
    dimensions: "Measurement to be added",
    supportsExtender: true,
    description: "A broad clasp for cuff-style chainmaille.",
  },
});

export const PRODUCT_TYPE_CONFIG = Object.freeze({
  bracelets: {
    slug: "bracelets",
    title: "Bracelets",
    description:
      "Bracelet sizes refer to the finished end-to-end length, including the clasp. Each bracelet is sized before being added to the cart, and compatible clasp and extender options are shown on the individual product page.",
    buyingGuideTitle: "Sizing & customisation guide",
    buyingGuide: [
      "Measure an existing bracelet end to end, including the clasp.",
      "If you do not have a bracelet to measure, measure your wrist and add ease for comfort.",
      "Wide or heavy bracelets may feel tighter than finer chains.",
      "Some weaves are built in repeating units, so the finished length may be up to 5 mm longer than requested rather than smaller.",
      "Optional extenders are available with compatible clasp styles.",
      "Clasp options vary by design.",
    ],
    fallbackUrl: "/types/bracelets",
  },
  necklaces: {
    slug: "necklaces",
    title: "Necklaces",
    description:
      "Necklaces are generally made to the advertised length, with small length adjustments available on the individual product page where suitable.",
    buyingGuideTitle: "Sizing & customisation guide",
    buyingGuide: [
      "Measure a necklace that falls where you want the new piece to sit, or use string to test the desired drop.",
      "Measure the string against a ruler before choosing a length.",
      "Small listed-length adjustments allow up to 5 cm shorter or 2 cm longer than the advertised length.",
      "For larger changes, contact Gloamweald before ordering so a custom length can be priced properly.",
      "Pendants may alter the visual drop even when the chain length is unchanged.",
    ],
    fallbackUrl: "/types/necklaces",
  },
  "wallet-chains": {
    slug: "wallet-chains",
    title: "Wallet chains",
    description:
      "Wallet-chain length is measured from one attachment point to the other along the chain. Use string to test the amount of drape you want between your belt loop and wallet, keys or other attachment point, then measure the string.",
    buyingGuideTitle: "Sizing & customisation guide",
    buyingGuide: [
      "A longer chain creates a deeper drape.",
      "Attachment hardware contributes to the total finished length.",
      "The selected length refers to the complete end-to-end item, including hardware.",
      "Extenders are not offered on wallet chains unless a specific product enables an equivalent option.",
    ],
    fallbackUrl: "/types/wallet-chains",
  },
  earrings: {
    slug: "earrings",
    title: "Earrings",
    description: "Earrings are listed with their relevant hardware and dimensions on each product page.",
    buyingGuideTitle: "Sizing & customisation guide",
    buyingGuide: ["Check the product page for dimensions, weight notes and available hardware."],
    fallbackUrl: "/types/earrings",
  },
  other: {
    slug: "other",
    title: "Accessories",
    description: "Accessories and other pieces use product-specific notes and customisation where relevant.",
    buyingGuideTitle: "Sizing & customisation guide",
    buyingGuide: ["Check the product page for measurements and available options."],
    fallbackUrl: "/types/other",
  },
});

export function createLengthOptions(ranges) {
  const options = [];
  ranges.forEach(({ from, to, step, priceDelta = 0 }) => {
    for (let value = from; value <= to + 0.0001; value += step) {
      const rounded = Math.round(value * 10) / 10;
      options.push({
        value: rounded,
        label: `${rounded.toLocaleString("en-AU", { maximumFractionDigits: 1 })} cm`,
        priceDelta,
      });
    }
  });
  return options;
}

export const STANDARD_BRACELET_LENGTHS = Object.freeze(
  createLengthOptions([
    { from: 14, to: 21, step: 0.5, priceDelta: 0 },
    { from: 21.5, to: 23, step: 0.5, priceDelta: 5 },
    { from: 23.5, to: 25, step: 0.5, priceDelta: 10 },
  ]),
);

export const BRACELET_LENGTH_TOLERANCE_NOTE =
  "I will do my best to come as close to the specified length as possible. This may involve extra rings or modified patterns near the clasp, and may not be exact. If I cannot make it exactly the desired length, I will never make it smaller; it may instead finish up to 5 mm over the desired length. Some weaves also flex and shift with tension, so measurements are taken with the bracelet extended to its full length.";

export const NECKLACE_LENGTH_ADJUSTMENT_NOTE =
  "Necklaces are generally made to the advertised length. You may request up to 5 cm less or up to 2 cm over the listed length. For other alterations or lengths, contact Gloamweald before ordering so I can provide a more appropriate price.";

export const STANDARD_EXTENDER_OPTIONS = Object.freeze(
  createLengthOptions([
    { from: 2, to: 5, step: 1, priceDelta: 0 },
    { from: 6, to: 10, step: 1, priceDelta: 1 },
  ]),
);

function necklaceAdjustmentOptions(advertisedLengthCm) {
  const base = Number(advertisedLengthCm);
  if (!Number.isFinite(base) || base <= 0) return [];

  return createLengthOptions([{ from: base - 5, to: base + 2, step: 1, priceDelta: 0 }]).map(
    (option) => {
      const difference = Math.round((option.value - base) * 10) / 10;
      const suffix =
        difference === 0
          ? "advertised length"
          : `${difference > 0 ? "+" : ""}${difference.toLocaleString("en-AU", {
              maximumFractionDigits: 1,
            })} cm`;

      return {
        ...option,
        label: `${option.label} (${suffix})`,
      };
    },
  );
}

export const STANDARD_WALLET_CHAIN_LENGTHS = Object.freeze(
  createLengthOptions([
    { from: 45, to: 65, step: 5, priceDelta: 0 },
    { from: 70, to: 80, step: 5, priceDelta: 10 },
  ]),
);

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
    slug: "dark-elf-bracelet",
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
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished bracelet length",
        mode: "standard",
        options: STANDARD_BRACELET_LENGTHS,
        toleranceNote: BRACELET_LENGTH_TOLERANCE_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "ring-clasp",
        allowedOptionIds: ["ring-clasp", "lobster", "small-carabiner", "medium-carabiner", "large-carabiner"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [
      {
        src: "assets/images/dark-elf-1.webp",
        alt: "Dark Elf Bracelet in stainless steel on a dark surface",
      },
      {
        src: "assets/images/dark-elf-2.webp",
        alt: "Dark Elf Bracelet worn around a tattooed wrist",
      },
      {
        src: "assets/images/dark-elf-3.webp",
        alt: "Dark Elf Bracelet worn against a weathered metal background",
      },
      {
        src: "assets/images/dark-elf-4.webp",
        alt: "Close detail of the Dark Elf Bracelet ring clasp and weave",
      },
      {
        src: "assets/images/dark-elf-5.webp",
        alt: "Close detail of the Dark Elf Bracelet weave held in hand",
      },
    ],
  },

  {
    id: "half-persian-bracelet",
    slug: "half-persian-bracelet",
    name: "Half Persian Bracelet",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 40,
      currency: CATALOG_CURRENCY,
    },
    description:
      "The classic Half Persian weave creates a timeless, flexible bracelet that drapes comfortably around the wrist. Its flowing pattern catches the light with every movement, balancing simplicity with quiet strength. ",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "Custom length x 8mm x 4mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished bracelet length",
        mode: "standard",
        options: STANDARD_BRACELET_LENGTHS,
        toleranceNote: BRACELET_LENGTH_TOLERANCE_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "lobster",
        allowedOptionIds: ["lobster", "toggle", "small-carabiner", "medium-carabiner"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [
      {
        src: "assets/images/half-persian-b-1.webp",
        alt: "Half Persian Bracelet in stainless steel on a dark surface",
      },
      {
        src: "assets/images/half-persian-b-2.webp",
        alt: "Half Persian Bracelet worn around a tattooed wrist",
      },
    ],
  },
  {
    id: "leoma-amulet",
    slug: "leoma-amulet",
    name: "Lēoma Amulet",
    type: "bracelets",
    components: ["gemstone"],
    collection: null,
    price: {
      amount: 110,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A tightly woven Jens Pind Linkage (JPL) chain creates a firm, structured band with a dense, cord-like feel. At its centre, a sphere of misty grey labradorite reveals flashes of blue and green at it turns through the light.",
    lore:
      "Lēoma: an old word, once referring to radiance, or light. In a nearby village, folk gave this name to the wandering lights sometimes seen between the thick trees of the Gloamweald, dancing just beyond the path, vanishing whenever pursued. The healers and elders, those of the old ways, possessed a certain skill that enabled them to occasionally gently coax a lēoma into certain stones, where it would remain safe and hidden. Only at the right angle does the captive light reveal itself, and when worn close to the skin, it is said to ward away the unnerving shadows that seem to watch from between the trees.",
    loreAccent: "#6f8fa5",
    loreGlow: "rgba(111, 143, 165, 0.4)",
    material: "Stainless steel · labradorite",
    clasp: "Lobster clasp",
    dimensions: "Custom length x 5mm x 5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished bracelet length",
        mode: "standard",
        options: STANDARD_BRACELET_LENGTHS,
        toleranceNote: BRACELET_LENGTH_TOLERANCE_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "lobster",
        allowedOptionIds: ["lobster", "small-carabiner", "medium-carabiner"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [
      {
        src: "assets/images/leoma-1.webp",
        alt: "Lēoma Amulet in stainless steel with a labradorite centrepiece on a dark surface",
      },
      {
        src: "assets/images/leoma-2.webp",
        alt: "Lēoma Amulet worn around a tattooed wrist",
      },
      {
        src: "assets/images/leoma-3.webp",
        alt: "Lēoma Amulet worn around a wrist beside dark fabric",
      },
      {
        src: "assets/images/leoma-4.webp",
        alt: "Close detail of the Lēoma Amulet labradorite centrepiece on a leaf",
      },
    ],
  },
  {
    id: "vertebrae-bracelet",
    slug: "vertebrae-bracelet",
    name: "Vertebrae Bracelet",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 45,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A distinctive raised weave with a repeating pattern that creates depth and texture. Bold without being bulky, it echoes the strength and flexibility of a spine.",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "Custom length x 12mm x 3.5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished bracelet length",
        mode: "standard",
        options: STANDARD_BRACELET_LENGTHS,
        toleranceNote: BRACELET_LENGTH_TOLERANCE_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "lobster",
        allowedOptionIds: ["lobster", "toggle", "small-carabiner", "medium-carabiner"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [
      {
        src: "assets/images/vertebrae-1.webp",
        alt: "Vertebrae Bracelet in stainless steel on a dark surface",
      },
      {
        src: "assets/images/vertebrae-2.webp",
        alt: "Vertebrae Bracelet worn across a tattooed hand",
      },
      {
        src: "assets/images/vertebrae-3.webp",
        alt: "Vertebrae Bracelet beside bone props on a dark surface",
      },
    ],
  },

  {
    id: "celtic-visions-bracelet",
    slug: "celtic-visions-bracelet",
    name: "Celtic Visions Bracelet",
    type: "bracelets",
    components: [],
    collection: null,
    price: {
      amount: 70,
      currency: CATALOG_CURRENCY,
    },
    description:
      "This intricate Celtic-inspired weave has an elegant balance of strength and detail. If you look closely, it may seem to be looking back at you, watching over you with quiet vigilance.",
    material: "Stainless steel",
    clasp: "Toggle bar",
    dimensions: "Custom length x 17mm x 8mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished bracelet length",
        mode: "standard",
        options: STANDARD_BRACELET_LENGTHS,
        toleranceNote: BRACELET_LENGTH_TOLERANCE_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "toggle",
        allowedOptionIds: ["lobster", "toggle", "medium-carabiner"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [
      {
        src: "assets/images/celtic-visions-1.webp",
        alt: "Celtic Visions Bracelet in stainless steel on a dark surface",
      },
      {
        src: "assets/images/celtic-visions-2.webp",
        alt: "Celtic Visions Bracelet worn around a tattooed wrist",
      },
    ],
  },

  {
    id: "european-4-in-1-cuff-6mm",
    slug: "european-4-in-1-cuff-6mm",
    name: "Chainmaille Cuff",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 55,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A tightly woven sheet of European 4-in-1 maille with a dense, armour-inspired texture. Small rings create a refined pattern that recalls the close-linked mail once worn beneath cloaks and armour.",
    material: "Stainless steel",
    clasp: "Slide lock",
    dimensions: "Custom length x 24mm x 3.5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished bracelet length",
        mode: "standard",
        options: STANDARD_BRACELET_LENGTHS,
        helperText:
          "This cuff is wider than a fine chain bracelet. Choose the finished length carefully and size up if you are between sizes.",
        toleranceNote: BRACELET_LENGTH_TOLERANCE_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "slide-lock",
        allowedOptionIds: ["slide-lock"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [
      {
        src: "assets/images/4in1-small-1.webp",
        alt: "Chainmaille Cuff in stainless steel on a dark surface",
      },
      {
        src: "assets/images/4in1-small-2.webp",
        alt: "Chainmaille Cuff worn around a tattooed wrist",
      },
      {
        src: "assets/images/4in1-small-3.webp",
        alt: "Chainmaille Cuff showing its slide lock clasp",
      },
      {
        src: "assets/images/4in1-small-4.webp",
        alt: "Close detail of the Chainmaille Cuff weave and clasp",
      },
      {
        src: "assets/images/4in1-small-5.webp",
        alt: "Chainmaille Cuff worn around the underside of a wrist",
      },
    ],
  },
  {
    id: "small-half-persian-necklace",
    slug: "small-half-persian-necklace",
    name: "Small Half Persian Necklace",
    type: "necklaces",
    components: [],
    collection: "classics",
    price: {
      amount: 100,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A slim Half Persian chain with an understated, close-wearing profile. Its narrow, flowing pattern drapes elegantly over collarbones or rippled fabric. Perfect for daily wear, this necklace pairs with any outfit, and is ideal for layering with other necklaces.",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "470mm x 6mm x 3.5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished necklace length",
        mode: "adjustment",
        inputType: "select",
        advertisedLengthCm: 47,
        options: necklaceAdjustmentOptions(47),
        helperText:
          "Choose the completed end-to-end necklace length, including the clasp.",
        toleranceNote: NECKLACE_LENGTH_ADJUSTMENT_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "lobster",
        allowedOptionIds: ["lobster", "toggle", "small-carabiner"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [
      {
        src: "assets/images/half-persian-n-1.webp",
        alt: "Small Half Persian Necklace worn close around a tattooed neck",
      },
    ],
  },

  {
    id: "full-persian-necklace",
    slug: "full-persian-necklace",
    name: "Full Persian Necklace",
    type: "necklaces",
    components: [],
    collection: "classics",
    price: {
      amount: 150,
      currency: CATALOG_CURRENCY,
    },
    description:
      "The classic Full Persian weave creates a dense, fluid chain with a substantial feel. Smooth and weighty, it settles naturally against the body.",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "600mm x 8mm x 8mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished necklace length",
        mode: "adjustment",
        inputType: "select",
        advertisedLengthCm: 60,
        options: necklaceAdjustmentOptions(60),
        helperText:
          "Choose the completed end-to-end necklace length, including the clasp.",
        toleranceNote: NECKLACE_LENGTH_ADJUSTMENT_NOTE,
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "lobster",
        allowedOptionIds: ["lobster", "toggle", "medium-carabiner"],
      },
      extender: {
        enabled: true,
        options: STANDARD_EXTENDER_OPTIONS,
      },
    },
    images: [],
  },

  {
    id: "bonelink-wallet-chain",
    slug: "bonelink-wallet-chain",
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
      `Hundreds of years ago, a long-forgotten story lived out deep within the Gloamweald, telling of a young maiden who lived in a small village at the edge of the forest. She was a kind girl, very ordinary by all accounts, with a stubborn streak that often ruffled feathers and, some whispered, was why she had still not married, despite being well past the age many thought she should have.

One evening, as the last of the day's light slipped behind the trees and villagers began closing shutters, lighting candles and calling their children indoors, she quietly walked into the Gloamweald alone, despite the warnings shouted after her, despite everybody knowing better than to wander beneath those trees after dark, and despite nobody understanding what could possibly have been important enough to draw her there.

By morning she had not returned.

The villagers gathered where the old road disappeared beneath the trees, waiting anxiously, certain that she would appear at any moment, but as the hours wore on and the sun climbed high above the forest before slowly beginning its descent once more, hope faded with the light. It was only as evening settled for a second time, the shadows growing long and twilight beginning to creep once more between the trunks, that somebody spotted movement deep amongst the trees.

A figure.

Then another cry rang out.

It was her.

Relief swept through the gathered villagers, and several of the braver souls hurried forward to meet her, laughing and calling her name, but their smiles quickly faded as she drew closer.

Her feet were bare, bloodied and caked with mud, the hem of her pale dress hanging in shredded strips, stained with earth and torn on briars, her hair loose, wild and tangled as though she had spent days pushing through undergrowth, and her face, almost unrecognisable beneath the dirt, seemed strangely empty, her wide, glassy eyes fixed on nothing at all.
  
She never answered their questions, never acknowledged the frightened voices calling after her, never even seemed to notice the hands reaching out to help.

Instead, she walked silently through the crowd, clutching something so strange and gruesome that the villagers scarcely knew where to look.

It was a chain, fashioned from dozens of little bones, each one carefully strung together with coarse twine woven from her own hair. No one recognised the bones, no one knew what creature they belonged to, and no one was brave enough to ask where she had found them.

Ignoring the frightened whispers around her, she made her way back to the little cottage where she lived alone, disappearing inside and quietly closing the door behind her.

Over the days that followed, several well-intentioned villagers knocked upon her door, bringing warm meals, fresh bread, flowers from their gardens and every excuse they could think of to check on her, but no matter how long they waited, or how softly they called her name, she never answered.

Then, just as suddenly as she had vanished from the village, she returned to it.

On the next market day, with merchants calling from their stalls and children weaving between crowded streets, the maiden simply walked into the village square as though nothing at all had happened.

At first, nobody recognised her.

Her features had hardly changed, and yet she seemed almost impossibly beautiful. Her once tangled hair now fell in soft, dark waves, woven back with delicate wildflowers that never seemed to wilt. She wore a finely made dress beneath a handsome travelling cloak, both of which looked far beyond anything she could ever have afforded, yet somehow suited her so perfectly that nobody questioned it for long.

There was something else, too.

People found themselves smiling as she passed, lingering in conversation longer than they had intended, laughing more easily than they usually would. She always seemed to know exactly the right thing to say, whether comforting a grieving widow, calming an anxious child, or settling some petty disagreement before it could become an argument, and to stand beside her, even for only a few moments, was simply... joyful.

The villagers were confused, of course, and questions still lingered in the backs of their minds, but before long they found themselves simply happy for her, and, little by little, the strange events surrounding her return became something people spoke of less and less.

The months that followed were unusually fortunate.

The little garden beside her cottage flourished beyond anything the village had ever seen, producing vegetables larger than any before them, flowers brighter than seemed possible, and fruit so plentiful that she often gave much of it away to neighbours who had fallen on hard times. She never seemed to want for anything, though nobody could explain how she had come by the beautiful clothes she now wore, nor where the quiet prosperity that surrounded her had come from.

In time, many young men sought her hand, though it was a handsome young blacksmith, hardworking, gentle, and well respected throughout the village, who eventually won her heart. Before long they were married, and together they raised three healthy children, living what anyone looking in from the outside would have called a long, peaceful and happy life.

Only now and then, when the wind caught her cloak as she worked amongst her flowers, or she bent to gather herbs from the garden, would those nearby hear the gentle rattle of the little chain still hanging at her waist, or catch the briefest glimpse of pale white before it disappeared once more beneath the folds of cloth.

Nobody ever asked to see it.

Nobody ever asked where it had come from.

Perhaps they feared the answer.

Or perhaps they loved her too much to care.

When she eventually passed away peacefully in old age, her husband was already an old man himself, long retired from the forge where he had spent almost his entire life. In the months that followed he quietly returned to his workshop one final time and, with hands that now trembled from age, carefully studied every little bone of the strange chain his wife had worn for almost the whole of her life before painstakingly forging three chains from steel in their likeness, one for each of their children.

What became of the original bones has never been agreed upon.

Some stories claim the old blacksmith buried them beside his wife, believing they belonged with her and nowhere else.

Others insist he sealed them forever within the steel itself, so that a small part of the original chain would live on in every generation that followed.

The blacksmith never revealed the truth.

The three children treasured their chains throughout their lives, and before long other smiths were asked to forge similar ones for those wishing to honour the old story. As the generations passed, the names of the maiden, the blacksmith and even the village itself were slowly forgotten, but the tradition quietly endured.

To this day, little chains of forged steel, shaped in memory of those forgotten bones, are given as gifts between loved ones, carried by travellers setting out on long journeys, and worn by those beginning a new chapter in their lives, in the hope that perhaps, just perhaps, a little of that old story still lingers within them.

And it is still said, all these centuries later, that those with a stubborn, determined heart find the Gloamweald just a little kinder.`,
    loreAccent: "#b9af9c",
    loreGlow: "rgba(185, 175, 156, 0.34)",
    material: "Stainless steel",
    clasp: "Carabiner",
    dimensions: "638mm x 12mm x 12mm",
    status: "Available - In stock",
    orderable: true,
    visual: "classic",
    customisation: {
      length: {
        enabled: false,
      },
      hardwareNote:
        "This in-stock piece is sold at the finished length shown. Contact Gloamweald if you need a different wallet-chain length.",
    },
    images: [
      {
        src: "assets/images/bonelink-1.webp",
        alt: "Bonelink Wallet Chain in stainless steel on a dark surface",
      },
      {
        src: "assets/images/bonelink-2.webp",
        alt: "Bonelink Wallet Chain hanging from weathered wood and metal",
      },
      {
        src: "assets/images/bonelink-3.webp",
        alt: "Close detail of the Bonelink Wallet Chain clasp and links",
      },
      {
        src: "assets/images/bonelink-4.webp",
        alt: "Close detail of the Bonelink Wallet Chain link pattern",
      },
      {
        src: "assets/images/bonelink-5.webp",
        alt: "Bonelink Wallet Chain arranged beside bone props on dark wood",
      },
    ],
  },

  {
    id: "half-persian-wallet-chain-pendant",
    slug: "half-persian-wallet-chain-pendant",
    name: "Half Persian Wallet Chain with Charm",
    type: "wallet-chains",
    components: [],
    collection: null,
    price: {
      amount: 85,
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
    customisation: {
      length: {
        enabled: true,
        required: true,
        label: "Finished wallet-chain length",
        mode: "standard",
        options: STANDARD_WALLET_CHAIN_LENGTHS,
        helperText:
          "Choose the complete end-to-end length, including attachment hardware.",
      },
      clasp: {
        enabled: true,
        required: false,
        includedOptionId: "medium-carabiner",
        allowedOptionIds: ["medium-carabiner", "large-carabiner"],
      },
      extender: {
        enabled: false,
      },
    },
    images: [
      {
        src: "assets/images/half-persian-w-1.webp",
        alt: "Half Persian Wallet Chain with Charm in stainless steel on a dark surface",
      },
      {
        src: "assets/images/half-persian-w-2.webp",
        alt: "Half Persian Wallet Chain with Charm clipped to a belt loop",
      },
      {
        src: "assets/images/half-persian-w-3.webp",
        alt: "Close detail of the Half Persian Wallet Chain charm and Byzantine link detail",
      },
      {
        src: "assets/images/half-persian-w-4.webp",
        alt: "Half Persian Wallet Chain with Charm hanging from a branch",
      },
      {
        src: "assets/images/half-persian-w-5.webp",
        alt: "Half Persian Wallet Chain with Charm worn from a belt loop",
      },
    ],
  },
    {
    id: "waymarker-necklace",
    slug: "waymarker-necklace",
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
      "The oldest paths through the Gloamweald were never marked with signs. Travellers instead followed rings of iron hung from branches or hammered into trunks, each one pointing towards the next before the forest swallowed it from view.",
    loreAccent: "#8f9a8a",
    loreGlow: "rgba(143, 154, 138, 0.36)",
    material: "Stainless steel · larvikite",
    clasp: "Lobster clasp",
    dimensions: "Custom length x mm x mm",
    status: "Coming soon",
    orderable: false,
    visual: "classic",
    images: [],
  },
  
  {
    id: "briar-imp-earrings",
    slug: "briar-imp-earrings",
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
      "Compact knots of interlinked stainless steel are finished with polished, outward-facing spikes. The upper spikes form a horned silhouette, with loosely-linked rings allowing each peice to shift with movement and life.",
    lore:
      "Briar imps make their nests where the undergrowth grows too thick for larger creatures to follow. Their horns resemble thorns, their bodies curl into tight, spined knots, and they are easily mistaken for burrs caught among the branches. They are troublesome little things, but not entirely cruel. Leave one a bright scrap of metal and it may guard your path from biting insects and painful flora. Refuse payment, and you may find that every briar finds your sock, and that biting insects are far kinder than a spiteful imp carrying sharp teeth and a grudge.",
    loreAccent: "#a13945",
    loreGlow: "rgba(161, 57, 69, 0.42)",
    material: "Stainless steel",
    clasp: "Earring",
    dimensions: "mm x mm x mm",
    status: "Coming soon",
    orderable: false,
    visual: "classic",
    images: [
      {
        src: "assets/images/briar-imp-1.webp",
        alt: "Pair of Briar Imp stainless steel earrings with horn-like polished spikes",
      },
    ],
  },
]);

export function productById(id) {
  return GLOAMWEALD_PRODUCTS.find((product) => product.id === id) || null;
}

export function productBySlug(slug) {
  const value = String(slug || "").trim();
  return GLOAMWEALD_PRODUCTS.find((product) => (product.slug || product.id) === value) || null;
}

export function productSlug(product) {
  return product?.slug || product?.id || "";
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

function normalisePriceDelta(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid customisation price adjustment.");
  }
  return Math.round(amount * 100) / 100;
}

function quantityValue(value) {
  const quantity = Math.floor(Number(value) || 1);
  return Math.max(1, Math.min(10, quantity));
}

function selectedValue(value) {
  if (value && typeof value === "object" && "value" in value) return value.value;
  return value;
}

function selectedId(value) {
  if (value && typeof value === "object" && "id" in value) return value.id;
  return value;
}

function selectedExtenderValue(value) {
  if (value && typeof value === "object") {
    if ("selected" in value && !value.selected) return "no";
    if ("value" in value) return value.value;
    if ("lengthCm" in value) return value.lengthCm;
    if ("selected" in value && value.selected) return "yes";
  }
  return value;
}

function valuesMatch(a, b) {
  const numberA = Number(a);
  const numberB = Number(b);
  if (Number.isFinite(numberA) && Number.isFinite(numberB)) {
    return Math.abs(numberA - numberB) < 0.0001;
  }
  return String(a) === String(b);
}

export function customisationForProduct(product) {
  return product?.customisation || {};
}

export function lengthOptionsForProduct(product) {
  const length = customisationForProduct(product).length;
  return Array.isArray(length?.options) ? length.options : [];
}

export function claspOptionsForProduct(product) {
  const config = customisationForProduct(product).clasp;
  if (!config?.enabled) return [];

  const allowed = Array.isArray(config.allowedOptionIds) ? config.allowedOptionIds : [];
  const includedId = String(config.includedOptionId || allowed[0] || "").trim();
  const ids = [
    includedId,
    ...allowed.filter((id) => id && id !== includedId),
  ].filter(Boolean);

  return ids
    .map((id) => CLASP_OPTIONS[id])
    .filter(Boolean)
    .map((option) => ({
      ...option,
      label: option.name,
      priceDelta: option.id === includedId ? 0 : normalisePriceDelta(option.priceDelta),
      isIncluded: option.id === includedId,
    }));
}

export function extenderOptionsForProduct(product) {
  const config = customisationForProduct(product).extender;
  if (!config?.enabled) return [];

  if (Array.isArray(config.options) && config.options.length) {
    return config.options;
  }

  const lengthCm = Number(config.lengthCm) || 3;
  return [
    {
      value: lengthCm,
      label: `${lengthCm.toLocaleString("en-AU", { maximumFractionDigits: 1 })} cm`,
      priceDelta: normalisePriceDelta(config.priceDelta),
    },
  ];
}

export function findLengthOption(product, value) {
  const wanted = selectedValue(value);
  return lengthOptionsForProduct(product).find((option) => valuesMatch(option.value, wanted)) || null;
}

export function findClaspOption(product, id) {
  const options = claspOptionsForProduct(product);
  const wanted = String(selectedId(id) || options[0]?.id || "").trim() || options[0]?.id || "";
  return options.find((option) => option.id === wanted) || null;
}

export function findExtenderOption(product, value) {
  const options = extenderOptionsForProduct(product);
  const wanted = selectedExtenderValue(value);
  if (wanted === undefined || wanted === null || wanted === "" || wanted === false || wanted === "no") {
    return null;
  }

  if (wanted === true || wanted === "true" || wanted === "yes" || wanted === "1") {
    return options.find((option) => valuesMatch(option.value, 3)) || options[0] || null;
  }

  return options.find((option) => valuesMatch(option.value, wanted)) || null;
}

export function normaliseProductConfiguration(product, selections = {}) {
  if (!product) throw new Error("Product is missing.");
  if (!product.orderable || productPriceAmount(product) === null) {
    throw new Error("This product is not currently orderable.");
  }

  const config = customisationForProduct(product);
  const normalised = {};

  if (config.length?.enabled) {
    const value = selectedValue(selections.length);
    if ((value === undefined || value === null || value === "") && config.length.required) {
      throw new Error("Choose a finished length before adding this piece to your cart.");
    }

    if (value !== undefined && value !== null && value !== "") {
      const option = findLengthOption(product, value);
      if (!option) throw new Error("Choose a valid finished length for this product.");
      normalised.length = {
        value: option.value,
        label: option.label,
        priceDelta: normalisePriceDelta(option.priceDelta),
      };
    }
  }

  if (config.clasp?.enabled) {
    const option = findClaspOption(product, selections.clasp);
    if (!option) throw new Error("Choose a compatible clasp for this product.");
    normalised.clasp = {
      id: option.id,
      label: option.label || option.name,
      priceDelta: normalisePriceDelta(option.priceDelta),
      supportsExtender: option.supportsExtender !== false,
    };
  }

  if (config.extender?.enabled) {
    const requestedExtender = selectedExtenderValue(selections.extender);
    const extenderOption = findExtenderOption(product, selections.extender);
    const wantsExtender = Boolean(extenderOption);
    const selectedClasp = normalised.clasp;

    if (wantsExtender && selectedClasp && selectedClasp.supportsExtender === false) {
      throw new Error("Extenders are not available with this clasp style.");
    }

    if (requestedExtender && requestedExtender !== "no" && !extenderOption) {
      throw new Error("Choose a valid extender length for this product.");
    }

    normalised.extender = {
      selected: wantsExtender,
      value: wantsExtender ? extenderOption.value : "",
      lengthCm: wantsExtender ? Number(extenderOption.value) : 0,
      label: wantsExtender ? `${extenderOption.label} extender` : "No extender",
      priceDelta: wantsExtender ? normalisePriceDelta(extenderOption.priceDelta) : 0,
    };
  }

  return normalised;
}

export function configuredUnitAmount(product, configuration = {}) {
  const base = productPriceAmount(product);
  if (base === null) return null;

  const additions = Object.values(configuration).reduce(
    (total, option) => total + normalisePriceDelta(option?.priceDelta),
    0,
  );

  return Math.round((base + additions) * 100) / 100;
}

export function selectionSummary(configuration = {}) {
  return [
    configuration.length?.label,
    configuration.clasp?.label,
    configuration.extender?.selected ? configuration.extender.label : "",
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" · ");
}

export function cartLineKey(productId, configuration = {}) {
  const length = configuration.length?.value ?? "";
  const clasp = configuration.clasp?.id ?? "";
  const extender = configuration.extender?.selected
    ? `extender:${configuration.extender.lengthCm || configuration.extender.value}`
    : "no-extender";
  return [productId, `length:${length}`, `clasp:${clasp}`, extender].join("|");
}

export function configuredCartLine(input = {}) {
  const productId = String(input.productId || input.id || "").trim();
  const product = productById(productId);
  if (!product) throw new Error("Cart contains an unknown product.");

  const configuration = normaliseProductConfiguration(product, input.selections || {});
  const basePrice = productPriceAmount(product);
  const finalUnitPrice = configuredUnitAmount(product, configuration);
  const quantity = quantityValue(input.quantity);
  const key = cartLineKey(product.id, configuration);

  return {
    key,
    id: key,
    productId: product.id,
    productName: product.name,
    quantity,
    basePrice,
    finalUnitPrice,
    price: finalUnitPrice,
    lineTotal: Math.round(finalUnitPrice * quantity * 100) / 100,
    selections: configuration,
    lineSummary: selectionSummary(configuration),
    product,
  };
}

export function checkoutConfiguredLineItem(input = {}) {
  const line = configuredCartLine(input);
  const name = line.lineSummary
    ? `${line.productName} — ${line.lineSummary}`
    : line.productName;

  return {
    id: line.productId,
    cartKey: line.key,
    name,
    productName: line.productName,
    quantity: line.quantity,
    unitAmount: line.finalUnitPrice,
    lineTotal: line.lineTotal,
    selections: line.selections,
    selectionSummary: line.lineSummary,
  };
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

export function validateProductCatalogue() {
  const issues = [];
  const ids = new Set();
  const slugs = new Set();

  GLOAMWEALD_PRODUCTS.forEach((product) => {
    const label = product?.id || product?.name || "Unnamed product";

    if (!product?.id) issues.push("A product is missing an id.");
    if (ids.has(product.id)) issues.push(`Duplicate product id: ${product.id}`);
    ids.add(product.id);

    const slug = productSlug(product);
    if (!slug) issues.push(`${label} is missing a slug.`);
    if (slugs.has(slug)) issues.push(`Duplicate product slug: ${slug}`);
    slugs.add(slug);

    if (!product?.name) issues.push(`${label} is missing a name.`);
    if (!PRODUCT_TYPE_CONFIG[product?.type]) issues.push(`${label} has an unsupported product type.`);

    const amount = productPriceAmount(product);
    if (product?.orderable && amount === null) issues.push(`${label} is orderable but has no numeric price.`);
    if (amount !== null && amount < 0) issues.push(`${label} has a negative price.`);

    if (!Array.isArray(product?.images)) {
      issues.push(`${label} has invalid images data.`);
    } else {
      product.images.forEach((image, index) => {
        if (!image?.src || !image?.alt) {
          issues.push(`${label} image ${index + 1} needs src and alt text.`);
        }
      });
    }

    const config = customisationForProduct(product);

    if (config.length?.enabled) {
      const options = lengthOptionsForProduct(product);
      if (config.length.required && !options.length) {
        issues.push(`${label} requires length but has no length options.`);
      }

      const values = new Set();
      options.forEach((option) => {
        const key = String(option.value);
        if (values.has(key)) issues.push(`${label} has duplicate length option ${key}.`);
        values.add(key);
        if (!option.label) issues.push(`${label} has a length option without a label.`);
        if (Number(option.priceDelta || 0) < 0) issues.push(`${label} has a negative length surcharge.`);
      });
    }

    if (config.clasp?.enabled) {
      const allowed = Array.isArray(config.clasp.allowedOptionIds) ? config.clasp.allowedOptionIds : [];
      if (!config.clasp.includedOptionId) {
        issues.push(`${label} needs an included clasp option.`);
      } else if (!CLASP_OPTIONS[config.clasp.includedOptionId]) {
        issues.push(`${label} includes unknown clasp option ${config.clasp.includedOptionId}.`);
      } else if (!allowed.includes(config.clasp.includedOptionId)) {
        issues.push(`${label} included clasp must also be in allowedOptionIds.`);
      }

      allowed.forEach((id) => {
        if (!CLASP_OPTIONS[id]) issues.push(`${label} allows unknown clasp option ${id}.`);
        if (Number(CLASP_OPTIONS[id]?.priceDelta || 0) < 0) {
          issues.push(`${label} clasp option ${id} has a negative surcharge.`);
        }
      });
    }

    if (config.extender?.enabled) {
      const options = extenderOptionsForProduct(product);
      if (!options.length) issues.push(`${label} has no extender options.`);
      options.forEach((option) => {
        const lengthCm = Number(option.value);
        if (!Number.isFinite(lengthCm) || lengthCm <= 0) {
          issues.push(`${label} has an invalid extender length.`);
        }
        if (!option.label) issues.push(`${label} has an extender option without a label.`);
        if (Number(option.priceDelta || 0) < 0) {
          issues.push(`${label} has a negative extender surcharge.`);
        }
      });
    }
  });

  return issues;
}
