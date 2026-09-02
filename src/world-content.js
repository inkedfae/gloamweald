/*
  World and lore hub source of truth.

  This file is meant to stay simple and human-editable. It describes the
  editorial structure for weald.html, plus short excerpts and relationships.
  Full product lore remains authoritative on each product object in
  src/product-catalog.js; do not duplicate complete product stories here.

  How to edit this hub:
  - Reorder arrays to change display order.
  - Keep every id unique, lowercase, and stable.
  - Use category values from WORLD_LORE_FROM_EDGE_CATEGORIES.
  - Link a lore-from-the-edge entry to one or more products with relatedProductIds, or to a
    collection with relatedCollectionId.
  - Use storyProductId when "Read the story" should open existing product lore.
  - Use hidden: true to keep an entry in the file without showing it.

  LORE FROM THE EDGE TEMPLATE — copy this when adding a similar entry
  // {
  //   id: "short-lore-entry-id",
  //   category: "Being",
  //   title: "Entry title",
  //   excerpt: "A short, explicit excerpt or summary drawn from existing lore.",
  //   storyProductId: "product-id",
  //   storyLabel: "Read the story",
  //   relatedProductIds: ["product-id"],
  //   relatedCollectionId: "",
  //   relationship: "Related product",
  //   hidden: false,
  // },
*/

export const WORLD_LORE_FROM_EDGE_CATEGORIES = Object.freeze([
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

const WORLD_BEGIN_HERE_TEXT = String.raw`
The Gloamweald is an immense, ancient forest, stretching across mountains, valleys and great swathes of land, so vast that towns, villages and, eventually, entire cities have grown along its borders without ever truly enclosing it. Nobody knows how old it is. Every people who have lived beside it seem to have inherited stories from those who came before them, and those stories in turn speak of older warnings, older roads and older things already living beneath the trees. There is no surviving history of the forest being planted, discovered or named for the first time; as far back as anyone has been able to look, the Gloamweald was simply already there.

For most of human history, the people living around it maintained an uneasy but practical relationship with the forest. Hunters ventured into its outer reaches during daylight, woodcutters took timber from familiar groves, and healers gathered herbs from places whose paths had been walked for generations, but there were limits that even the bravest generally understood. The farther one travelled, the thicker the trees grew, until trunks crowded close enough to turn daylight dim and old paths disappeared beneath root, moss and undergrowth. Children were taught which streams could lead them safely home, which clearings were best avoided, and why a light moving gently between the trees should never be assumed to belong to another traveller.

People entered the fringes because there were useful things there, and because familiarity can make almost anything feel manageable, but few willingly crossed beyond the places their families knew, and fewer still remained beneath the canopy once the sun began to fall. There were stories enough to discourage them: hunters returning days after they should have, unable to explain where they had been; familiar roads leading somewhere entirely different on the journey home; voices calling from the trees in the tones of people long dead; beautiful strangers appearing where no stranger had any reason to be. Some stories contradicted one another, some were probably invented to frighten children, and others had been repeated for so many centuries that nobody remembered what had happened first.

The result was much the same.

People knew where not to go.

For a very long time, that was enough.

As human settlements grew, however, old caution gradually began to look more like superstition. Roads became wider, towns became cities, and the idea that a forest should remain untouched simply because generations of people had been afraid of it became increasingly difficult to defend against governments, developers and companies looking at thousands of hectares of apparently unused land. What could not be crossed with a cart could be crossed with machinery; what could not be cleared with an axe could be levelled with engines powerful enough to tear whole trees from the earth.

So the borders of the Gloamweald began to retreat.

Great sections of the outer woodland were cut away, sometimes kilometres at a time, and what followed looked much like development anywhere else. Roads were laid across old hunting paths, drainage systems cut through wetlands, and concrete was poured over places where boundary stones had stood for longer than anyone could remember. Housing estates appeared, then apartment blocks, shopping centres, warehouses, clinics, service stations, transmission towers and industrial estates, until there were places where a person could stand beneath fluorescent lights at midnight and never know that, within living memory, the same ground had been beneath a forest canopy.

For a while, it seemed that the old stories had simply been stories after all.

The outer forest could be cleared, and so people naturally assumed the rest eventually could be too.

Yet the farther development pushed towards the deeper Gloamweald, the less reliably anything seemed to work.

At first, there was nothing particularly remarkable about it. Construction projects suffer accidents, equipment fails, contractors miscalculate and people occasionally become lost. It was only over time, as the same kinds of problems accumulated across different projects and different companies, that a pattern became harder to ignore. Survey markers were found metres or kilometres from where they had been placed. Machinery disappeared from secured sites and was sometimes recovered somewhere it could not reasonably have reached. Workers became lost within sight of roads they had travelled every morning for months. Equipment failed without obvious mechanical cause; injuries mounted; people resigned suddenly, sometimes abandoning extraordinarily well-paid work without explanation.

Some projects simply became too expensive to continue. Others ended after deaths, disappearances or accidents serious enough that nobody wanted the liability of being the company that tried again.

There were investigations, of course. Reports were written. Committees were formed. Explanations were offered involving terrain, weather, human error, poor management, groundwater, unstable soil and countless other perfectly sensible things, many of which were probably true at least some of the time.

Nevertheless, every serious attempt to push development significantly into the deeper forest eventually stopped.

In the present day, much of the surviving Gloamweald is protected from further development. There are environmental protections, restricted zones and great sections of land that may no longer legally be cleared, something often spoken about as a victory of conservation over the destructive ambitions of earlier generations.

People from the older settlements along its borders tend to find this interpretation quietly amusing.

The law may now protect the Gloamweald from us.

Whether it ever required our protection is another question entirely.

What the clearing did accomplish, however, was something generations of old stories had rarely needed to consider: it moved the boundary.

The trees retreated, but not everything that had lived beneath them retreated with them.

Some creatures disappeared deeper into the forest as the machines approached. Others remained hidden in fragments of woodland left between roads and buildings, adapting slowly to a world that had arrived around them almost overnight. Still others followed humans willingly, discovering that cities offered new sources of food, shelter, entertainment and opportunity that the old forest never had.

Things once glimpsed only beside woodland paths began appearing beneath bridges, behind service stations and inside stormwater drains. Creatures that had navigated by moonlight learned the cycle of streetlamps and headlights, while scavengers that once followed travelling parties discovered nightclub alleys, railway platforms, restaurant bins and the endless abundance of things humans throw away. Some species adapted so thoroughly that younger generations have never lived beneath the Gloamweald’s canopy at all.

Those changes were not always merely behavioural. Over generations, some beings altered physically as well, shaped in subtle and sometimes spectacular ways by the environments in which they lived. Creatures accustomed to darkness developed eyes better suited to artificial light; others became increasingly tolerant of smoke, heat, chemical fumes or polluted water. Pigmentation changed. Wings thickened, thinned or shifted in colour. Some city-born fae developed strange iridescent sheens across hair, scales, feathers or wings, shimmering violet, blue and green like petrol spread across wet pavement, while others acquired traits that had never been recorded in their forest-dwelling ancestors at all.

Nobody is entirely sure whether these changes are biological, magical or some combination of the two. In creatures for whom body, environment and magic have never been especially separate things, the distinction may not matter very much.

The fae adapted too, although not always easily.

There are fae whose bodies were never made for exhaust fumes, industrial chemicals or the constant haze of particulates suspended over a city, who wear respirators beneath black hoods or carry medicines that dull the headaches, sickness and skin reactions caused by a world their ancestors never had to survive. Others have found that years spent beneath artificial light, surrounded by concrete and machinery, have changed them in less predictable ways, sometimes leaving behind physical traits that mark them unmistakably as creatures shaped as much by the city as by the forest their ancestors came from.

Modern life itself has not been kind to all of them.

The old stories concerning iron were not entirely wrong, only considerably less precise than generations of human retellings made them seem.

Not all fae are harmed by iron. Some have never been affected by it at all, while others experience little more than irritation after prolonged contact. For some, however, bare iron still raises angry burns across the skin, suppresses glamour and leaves them weak or feverish for hours afterwards. The difference appears to depend upon the kind of fae, the individual and, increasingly, the circumstances in which they were raised.

As iron and steel became impossible to avoid in the human world, some fae discovered that the reaction itself could change.

Repeated exposure in sufficiently small amounts sometimes allowed the body to accommodate what it had once treated almost like poison. The process was slow, unpleasant and difficult to predict, requiring exposure careful enough to encourage adaptation without causing serious injury, and older fae generally found it considerably more difficult than the young. For beings whose bodies and magic had remained largely unchanged for hundreds of years, adaptation could take decades.

Among younger fae, particularly those born close to human settlements, it became increasingly common.

No one has ever agreed upon exactly what happens during this process. Modern researchers tend to call it ferrous acclimation; older fae sometimes speak of taking the iron. Neither term explains why the adaptation occasionally leaves something visible behind.

A fae who has undergone extensive exposure may develop what are now commonly called steelmarks: silver rings appearing around an iris, pupils or patches of sclera taking on a metallic sheen, heavy white or silver streaks growing through otherwise unchanged hair, or branching marks beneath the skin that resemble veins drawn in polished metal. Horns may acquire steel-coloured tips, the edges of wings may turn silver or gunmetal, feathers may grow pale metallic shafts, and nails may darken or brighten until they look more forged than grown.

These changes are distinct from the many other adaptations seen in city-dwelling fae. The petrol-slick iridescence found in some wings, hair and scales, for example, appears in populations with little or no history of iron sensitivity at all, as do countless other alterations associated with artificial light, polluted air, industrial environments and generations spent living far from the forest. Steelmarks, by contrast, are strongly associated with prolonged exposure to iron and steel.

The changes do not appear in everyone, nor do they follow any reliable pattern. Some regard them as scars. Others consider them beautiful. A few old fae still regard them with something approaching horror.

In rare cases, adaptation seems to go further.

The iron ceases merely to be harmless.

It becomes useful.

Fae who reach this stage describe worked metal as carrying magic differently, almost as though something that once interrupted their power has become capable of conducting it. Steel worn close against the body may strengthen glamour, steady unstable magic or make certain forms of protection considerably easier. Nobody quite knows why this happens, and deliberately attempting to force the transformation remains dangerous enough that even among modern fae it is treated with considerable caution.

Changelings, however, complicated everything.

A changeling raised among humans is usually exposed to iron long before anyone thinks to protect them from it. They grow up handling cutlery and keys, sleeping in beds held together with steel, climbing playground equipment, leaning against railings, riding in cars and touching a thousand small pieces of metal every day. Their exposure is careless, constant and begins while both body and magic are still developing.

Many suffer for it.

Others adapt.

And some adapt far beyond what is normally seen in fae raised within the Gloamweald.

For centuries, changelings had often occupied an uncomfortable place in stories told by both humans and fae: creatures displaced from one world and raised within another, never entirely belonging to either. Older fae sometimes regarded those raised by humans as diminished by the experience, their manners strange, their magic blunted and their bodies polluted by a world full of iron, smoke and machinery.

The contemporary changelings have not been especially interested in preserving that opinion.

Among some younger fae communities, wearing steel directly against bare skin has become a declaration of strength, particularly when worn heavily enough that there can be no question that the contact is deliberate. Thick chains, rings, piercings and articulated pieces resembling fragments of armour are worn not despite the old stories, but because of them. What was once carried against fae as protection has been taken back, reshaped and worn openly.

Changelings are particularly associated with the practice, partly because so many possess an unusual tolerance for worked metal and partly because many have become rather tired of being told that surviving the human world made them less fae. Those whose magic is strengthened by steel may wear it almost as an extension of themselves, heavy chains and close-fitting rings carrying power across the body in the same way armour once carried force away from it.

For others, there is no magical advantage at all.

They wear it anyway.

There are young fae who dress in black vinyl and metal hardware, their hair or wings shimmering with the strange rainbow sheen of petrol on wet pavement, who would look utterly alien to the creatures their ancestors once knew and perfectly ordinary beneath the coloured lights of a nightclub. There are others who resent the city deeply, who speak of the Gloamweald as though it were a homeland stolen from them, despite having never seen anything beyond the thin fragments of woodland surviving between highways.

Among contemporary changelings in particular, steel has acquired meanings that extend far beyond simple tolerance. To wear it openly against the skin may be fashion, protection, provocation, pride or some combination of all four; a declaration that the thing once used to ward their kind away can no longer dictate where they belong. Some wear only a few rings or a thin chain. Others favour weight, building themselves in steel until wrists, throats, ears and waists are hung with enough metal that another fae could never mistake the gesture for accidental.

The more headstrong among them have never been especially interested in subtlety.

Not every creature displaced by human development has suffered from it.

Some have flourished.

Things that once preyed upon lonely travellers discovered that human cities produce loneliness in staggering abundance. Glamour that had once been used to mislead hunters or lure someone from a path found uses in clubs, bars, scams, sex work, performance, theft and countless other little economies built around human desire. Faerie foods and substances that once appeared in stories as dangerous gifts have found their way into modern markets, sold to people seeking an experience no human drug can quite reproduce and collected later in debts that are not always paid in money.

There are fae who exploit humans because they are cruel.

There are fae who do it because their understanding of fairness has never resembled ours.

There are also fae who work ordinary jobs, pay rent, complain about public transport and spend half their lives maintaining paperwork for identities that were never designed to survive for centuries. Some conceal themselves because they fear humans; others because being discovered would be inconvenient; others simply because they have no particular interest in becoming anyone’s proof that folklore is real.

The world beyond the Gloamweald has therefore become stranger than it once was, even if most humans have become less capable of recognising that strangeness for what it is. Things that once belonged to the forest have spread along roads, railway lines and human migration routes, moving farther from the old woodland with each generation until creatures born hundreds of kilometres away may still carry instincts shaped by a place they have never visited.

Yet none of this should be mistaken for the Gloamweald itself.

Beyond the cleared land, beyond the fragmented woods and the paths still walked by hunters, the forest grows older and stranger as it thickens. Modern maps become less reliable there. Roads that appear on one survey vanish from another, and ruins have been found in places where no known settlement should ever have existed. The beings that wander into cities are, for the most part, the ones capable of living close enough to humanity to do so.

Far deeper within the weald are older things.

Some are creatures whose names survive only in fragments of folklore; others have never been named by humans at all. There are powers beneath those trees that watched kingdoms rise, fracture and disappear, for whom the span of a human civilisation may be little more than a season. Whatever lives there has never needed to learn how to survive our roads, our machines or our polluted air, because we have never successfully forced those things upon it.

Humanity cleared part of the forest and mistook that for conquest.

The Gloamweald appears to have taken a longer view.

It was old before our oldest stories began, and if the stories are right, it will remain long after there is nobody left to tell them.

The jewellery is made at its edge. The stories tell you what followed it out.
`;

export const WORLD_BEGIN_HERE = Object.freeze({
  eyebrow: "The World",
  title: "Begin here.",
  paragraphs: Object.freeze(WORLD_BEGIN_HERE_TEXT.trim().split(/\r?\n\s*\r?\n/)),
});

export const WORLD_LORE_FROM_EDGE = Object.freeze([
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
      "Placeholder lore-from-the-edge entry for testing a place connected to more than one product. Replace this with established place lore when ready.",
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
  const categories = new Set(WORLD_LORE_FROM_EDGE_CATEGORIES);

  WORLD_LORE_FROM_EDGE.forEach((entry) => {
    const label = entry?.id || entry?.title || "Unnamed lore-from-the-edge entry";

    if (!entry?.id) issues.push("A lore-from-the-edge entry is missing an id.");
    if (ids.has(entry.id)) issues.push(`Duplicate lore-from-the-edge entry id: ${entry.id}`);
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
