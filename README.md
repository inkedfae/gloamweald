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

All editable product information is kept in `src/product-catalog.js`. This is
the single source used by the shop display and by the backend checkout pricing.
Do not copy product prices into checkout functions.

`products.js` is only a small compatibility loader for the existing static
pages. It reads `src/product-catalog.js` and exposes the catalogue to the
browser.

Each product looks like this:

```js
{
  id: "unique-short-name",
  name: "Product Name",
  type: "bracelets",
  components: ["bone"],
  collection: null,
  price: {
    amount: 45,
    currency: CATALOG_CURRENCY,
  },
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
`src/product-catalog.js` as the real collections are developed.

Products only become checkout-eligible when both of these are true:

```js
orderable: true
price: { amount: 45, currency: CATALOG_CURRENCY }
```

If `price.amount` is `null`, the product remains enquiry-only even if it is
shown on the site.

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

The catalogue pages are static, but live PayPal and Stripe checkout need backend
serverless functions. The site is intended for Cloudflare Pages, which can run
the checkout functions from the `/functions` directory.

The repo includes Cloudflare Pages Functions:

- `functions/api/create-stripe-session.js` -> `/api/create-stripe-session`
- `functions/api/confirm-stripe-session.js` -> `/api/confirm-stripe-session`
- `functions/api/stripe-webhook.js` -> `/api/stripe-webhook`
- `functions/api/checkout-config.js` → `/api/checkout-config`
- `functions/api/create-paypal-order.js` → `/api/create-paypal-order`
- `functions/api/capture-paypal-order.js` → `/api/capture-paypal-order`
- `src/checkout-shared.js` → shared server-side checkout helpers imported by the functions

Before checkout can go live, add these in Cloudflare Dashboard:

`Workers & Pages` → your Pages project → `Settings` → `Variables and Secrets`

```text
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
CONTACT_EMAIL
```

Optional:

```text
PAYPAL_ENV=sandbox
RESEND_FROM=Gloamweald <onboarding@resend.dev>
```

Keep `PAYPAL_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`RESEND_API_KEY` out of HTML, CSS, and frontend JavaScript. They belong only in
Cloudflare environment variables/secrets.

The frontend loads public checkout readiness from `/api/checkout-config`.
That endpoint returns only safe public checkout config:

```json
{
  "paypalClientId": "public PayPal client id from Cloudflare",
  "currency": "AUD",
  "paypalEnv": "sandbox",
  "stripeConfigured": true
}
```

If `PAYPAL_CLIENT_ID` is not set, `/api/checkout-config` returns
`configured: false` and the PayPal button remains disabled with a clear message.
If Stripe backend variables are not set, it returns `stripeConfigured: false`
and the Stripe button remains disabled. The endpoint must not return
`PAYPAL_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, or `CONTACT_EMAIL`.

Use PayPal sandbox first. When sandbox checkout, capture, cart clearing, and
server-side Resend order emails all work, switch `PAYPAL_ENV` and the PayPal
credentials to live.

For Stripe, use test keys first. Configure a Stripe webhook endpoint pointing to:

```text
https://YOUR-CLOUDFLARE-PAGES-DOMAIN/api/stripe-webhook
```

Listen for `checkout.session.completed`. If you later enable asynchronous Stripe
payment methods, also listen for `checkout.session.async_payment_succeeded`.
Use the webhook signing secret as `STRIPE_WEBHOOK_SECRET`.

The Stripe success page only confirms the Checkout Session server-side before
clearing the cart. It does not send order emails. Stripe order notification
emails are sent server-side from the webhook, and the webhook marks the Stripe
Checkout Session metadata after a successful email send so retried webhook events
do not send the same order email again.

## Checkout safety checks

Run this before pushing checkout changes:

```powershell
node scripts/checkout-safety-check.mjs
```

It verifies that `/api/checkout-config` exposes only public config, frontend
code does not contain server-only environment variable names, the PayPal SDK is
loaded only after a public Client ID is returned, Stripe uses only local backend
routes, and the backend order token flow still works.
