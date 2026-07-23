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
        CATALOG_CURRENCY,
        CLASP_OPTIONS,
        collections: GLOAMWEALD_COLLECTIONS,
        productTypes: PRODUCT_TYPE_CONFIG,
        products: GLOAMWEALD_PRODUCTS,
        cartLineKey,
        checkoutConfiguredLineItem,
        claspOptionsForProduct,
        configuredCartLine,
        configuredUnitAmount,
        customisationForProduct,
        findClaspOption,
        findLengthOption,
        lengthOptionsForProduct,
        normaliseProductConfiguration,
        productById,
        productBySlug,
        productDisplayPrice,
        productPriceAmount,
        productSlug,
        selectionSummary,
        validateProductCatalogue,
      };`,
    )();
  }

  try {
    const catalog = evaluateCatalog(loadCatalogSource());
    window.GLOAMWEALD_COLLECTIONS = catalog.collections;
    window.GLOAMWEALD_PRODUCT_TYPES = catalog.productTypes;
    window.GLOAMWEALD_CLASP_OPTIONS = catalog.CLASP_OPTIONS;
    window.GLOAMWEALD_PRODUCTS = catalog.products.map((product) => ({
      ...product,
      displayPrice: catalog.productDisplayPrice(product),
    }));
    window.GloamwealdCatalog = {
      ...catalog,
      products: window.GLOAMWEALD_PRODUCTS,
    };
  } catch (error) {
    console.error("Gloamweald product catalogue could not be loaded.", error);
    window.GLOAMWEALD_COLLECTIONS = window.GLOAMWEALD_COLLECTIONS || {};
    window.GLOAMWEALD_PRODUCT_TYPES = window.GLOAMWEALD_PRODUCT_TYPES || {};
    window.GLOAMWEALD_CLASP_OPTIONS = window.GLOAMWEALD_CLASP_OPTIONS || {};
    window.GLOAMWEALD_PRODUCTS = window.GLOAMWEALD_PRODUCTS || [];
    window.GloamwealdCatalog = window.GloamwealdCatalog || {};
  }
})();
