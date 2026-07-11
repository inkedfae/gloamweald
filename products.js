(() => {
  "use strict";

  /*
    Product data lives in src/product-catalog.js.
    This compatibility loader keeps the existing non-module pages working without
    duplicating product IDs, prices, or catalogue metadata here.
  */
  const CATALOG_PATH = "src/product-catalog.js";

  function loadCatalogSource() {
    const request = new XMLHttpRequest();
    request.open("GET", CATALOG_PATH, false);
    request.send(null);

    if (request.status && (request.status < 200 || request.status >= 300)) {
      throw new Error(`Could not load ${CATALOG_PATH}.`);
    }

    return request.responseText;
  }

  function evaluateCatalog(source) {
    const browserSource = source
      .replaceAll("export const ", "const ")
      .replaceAll("export function ", "function ");

    return new Function(
      `${browserSource}
      return {
        collections: GLOAMWEALD_COLLECTIONS,
        products: GLOAMWEALD_PRODUCTS,
        productDisplayPrice,
      };`,
    )();
  }

  try {
    const catalog = evaluateCatalog(loadCatalogSource());
    window.GLOAMWEALD_COLLECTIONS = catalog.collections;
    window.GLOAMWEALD_PRODUCTS = catalog.products.map((product) => ({
      ...product,
      price: catalog.productDisplayPrice(product),
    }));
  } catch (error) {
    console.error("Gloamweald product catalogue could not be loaded.", error);
    window.GLOAMWEALD_COLLECTIONS = window.GLOAMWEALD_COLLECTIONS || {};
    window.GLOAMWEALD_PRODUCTS = window.GLOAMWEALD_PRODUCTS || [];
  }
})();
