# Gloamweald

A framework-free, multi-page storefront for handmade chainmail jewellery and
accessories. It uses HTML, CSS, and a little JavaScript.

## Pages

- `index.html` — Home
- `shop.html` — The full catalogue, filtered by type and component
- `collections.html` — Collection directory
- `collection-*.html` — One story and product page per collection
- `about.html` — The maker, name, and process
- `care.html` — Materials and care
- `contact.html` — Email and Instagram

## Where products live

All product information is kept in `products.js`. This prevents a collection
piece from needing to be copied and maintained in several HTML files.

Each product looks like this:

```js
{
  id: "unique-short-name",
  name: "Product Name",
  type: "bracelets",
  components: ["bone"],
  collection: null,
  price: "$45 AUD",
  description: "A short product description.",
  material: "Stainless steel · bone",
  status: "Available by enquiry",
  orderable: true,
  visual: "bone",
}
```

Accepted `type` values:

- `bracelets`
- `necklaces`
- `wallet-chains`
- `earrings`
- `other`

Accepted `components`:

- `gemstone`
- `bone`
- `fossil`

Components are written inside square brackets. A piece can have none, one, or
several:

```js
components: []
components: ["bone"]
components: ["gemstone", "bone"]
```

Most products should use:

```js
collection: null
```

A product made specifically for a collection uses one of:

```js
collection: "classics"
collection: "morrigan"
collection: "tenebris"
collection: "wyrms-hoard"
```

The product then appears automatically in the full shop and on that
collection's page.

## Concept products

The collection pages currently contain clearly labelled concept placeholders.
They are not presented as available products. Replace or remove them in
`products.js` as the real collections are developed.

## Product photographs

Add photographs to a product with an `images` list:

```js
images: [
  {
    src: "assets/images/product-primary.jpg",
    alt: "A short, useful description of the photograph",
  },
  {
    src: "assets/images/product-second-view.jpg",
    alt: "The product shown from underneath",
  },
],
```

The first image is the primary photograph. Additional images appear in a
horizontally scrolling gallery inside the same product card. Products without
an `images` list keep the decorative photography placeholder.

Copy new image files into `assets/images` and give them short lowercase
filenames with hyphens.

## Previewing

Ask Codex to start the local preview, or run this command in the project folder:

```text
python -m http.server 8000
```

Then visit `http://127.0.0.1:8000/`.

## Publishing

The site is suitable for GitHub Pages. It does not need a database or build
step. Commit the files and push them to the branch used by GitHub Pages.
