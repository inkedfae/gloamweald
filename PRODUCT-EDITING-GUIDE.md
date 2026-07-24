# Gloamweald product editing guide

Product data lives in [src/product-catalog.js](src/product-catalog.js). That file is the main place to edit products, product types, sizes, clasp options, price adjustments, orderable status, lore and images.

## Add a new product

1. Copy an existing product object that is similar to the new piece.
2. Give it a unique `id` and `slug`. Keep both lowercase, URL-safe and unaccented.
3. Enter the visible `name`, `price`, `description`, `material`, `dimensions`, `status` and `images`.
4. Set the product `type`, such as `bracelets`, `necklaces`, `wallet-chains`, `earrings` or `other`.
5. Add `lore` only if the product needs a story section.
6. Set `orderable: true` only when the product can be bought through checkout.
7. Enable only the customisation options that can genuinely be made for that product.
8. Check the new product page on desktop and mobile.

## Change bracelet sizes

All orderable bracelets currently use the same shared length options:

```js
options: STANDARD_BRACELET_LENGTHS,
```

That currently gives:

- 14-21 cm included
- 21.5-23 cm +$5
- 23.5-25 cm +$10

Keep the bracelet tolerance note on bracelet products so customers know the finished length may be slightly over the requested size, but never smaller.

## Change necklace lengths

Orderable necklaces generally use the advertised length as the base length, then allow a small dropdown adjustment from 5 cm shorter to 2 cm longer:

```js
advertisedLengthCm: 47,
options: necklaceAdjustmentOptions(47),
```

For larger necklace changes, direct the customer to contact Gloamweald for a custom price.

## Change clasp availability

Global clasp information is stored once in `CLASP_OPTIONS`.

Each product then lists which clasp IDs are compatible:

```js
includedOptionId: "lobster",
allowedOptionIds: ["lobster", "toggle", "medium-carabiner"],
```

The `includedOptionId` is the clasp supplied at no extra cost for that specific product. The included clasp must also appear in `allowedOptionIds`.

Do not add a clasp ID to a product unless that clasp is structurally suitable for that design.

## Change extender options

Bracelets and necklaces use the shared extender options:

```js
options: STANDARD_EXTENDER_OPTIONS,
```

That currently gives:

- 2-5 cm: $0
- 6-10 cm: +$1

## Change prices

There are several price layers:

- Base product price: `price.amount`
- Length surcharge: each length option's `priceDelta`
- Clasp surcharge: the global clasp option's `priceDelta`
- Extender surcharge: each extender option's `priceDelta`

The cart and checkout backend calculate the final item price from this catalogue data.

## Add product images

Product images are currently stored in:

```text
assets/images/
```

Use lowercase, URL-safe filenames where possible. Product image paths should be added to the product's `images` array:

```js
images: [
  {
    src: "assets/images/dark-elf-1.webp",
    alt: "Dark Elf Bracelet in stainless steel on a dark surface",
  },
],
```

The shop cards display images inside a 4:5 frame with `object-fit: contain`, so the full image stays visible. Future product photos ideally work well as 4:5 portrait images, but they do not need to be cropped exactly because the dark frame will fill any empty space.

## Product type pages

Product-type page wording lives in `PRODUCT_TYPE_CONFIG`. To add a new type later:

1. Add one entry to `PRODUCT_TYPE_CONFIG`.
2. Assign that `type` to relevant products.
3. Add concise buying guidance if needed.

The reusable type page will use that data automatically.
