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
      "Lēoma is an old word meaning radiance, or ray of light. It's often used to refer to the wandering lights that are sometimes seen between the thick trees of the Gloamweald, dancing just beyond the path, vanishing whenever they are pursued. The old wise ones learned that occasionally a Lēoma could be coaxed gently into certain stones, where it would remain hidden, and safe. Only at the right angle does the captive light reveal itself, and when worn close to the skin, it is said to ward away the deeper darkness that watches from beneath the trees.",
    loreAccent: "#6f8fa5",
    loreGlow: "rgba(111, 143, 165, 0.4)",
    material: "Stainless steel · labradorite",
    clasp: "Lobster clasp",
    dimensions: "Custom length x 5mm x 5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
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
    name: "Vertebrae Bracelet",
    type: "bracelets",
    components: [],
    collection: "classics",
    price: {
      amount: 50,
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
    dimensions: "Custom length x 17mm x 8mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
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
    name: "Chainmaille Cuff",
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
    name: "Small Half Persian Necklace",
    type: "necklaces",
    components: [],
    collection: "classics",
    price: {
      amount: 100,
      currency: CATALOG_CURRENCY,
    },
    description:
      "A slim Half Persian chain with an understated, close-wearing profile. Its narrow, flowing pattern drapes elegantly over collarbones or rippled fabric, and is ideal for daily wear, easy to layer with other necklaces.",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "470mm x 6mm x 3.5mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [
      {
        src: "assets/images/half-persian-n-1.webp",
        alt: "Small Half Persian Necklace worn close around a tattooed neck",
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
      amount: 150,
      currency: CATALOG_CURRENCY,
    },
    description:
      "The classic Full Persian weave creates a dense, fluid chain with a substantial feel. Smooth and weighty, it settles naturally against the body",
    material: "Stainless steel",
    clasp: "Lobster clasp",
    dimensions: "600mm x 8mm x 8mm",
    status: "Available - Made to order",
    orderable: true,
    visual: "classic",
    images: [],
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
