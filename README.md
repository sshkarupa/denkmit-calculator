# Denkmit Dosage Calculator

A lightweight, offline-capable progressive web app (PWA) for estimating laundry detergent dosage for selected Denkmit products.

## Features

- Vanilla JavaScript, HTML, and CSS; no build tools or dependencies.
- Russian, English, Czech, and German interface.
- Manufacturer dosage tables for five Denkmit products (gels and powders).
- Weight slider (0.5–9 kg), water hardness, and soil level.
- Remembers language, detergent, and water hardness using localStorage.
- Resets laundry weight and soil level on each visit.
- Offline support after the first successful online load via service worker.
- Works on Android and iOS using **Add to Home Screen**.

## Publishing with GitHub Pages

In **Settings → Pages**, select **Deploy from a branch**, choose **main**, and select **/(root)**. The app URL should be:

https://sshkarupa.github.io/denkmit-calculator/

Pages deployment can take a few minutes. GitHub Pages provides HTTPS, which is required for service workers.

## Data and accuracy

The tables in [products.json](./products.json) contain source links to dm.cz. Manufacturer tables apply to each product's specified standard load. **Other load sizes are estimates**, using a scaling factor with a minimum of 55% of the standard dose; this is a convenience heuristic, not a manufacturer recommendation. Always follow the label on the purchased product when it differs.

Powder doses are displayed in millilitres of the measuring cup and approximately in grams, based on the product-specific conversion of 85 ml = 67.5 g. Do not apply this density to other powders.

## Local development

Serve the repository root with any static HTTP server, for example:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. Service workers work on localhost or HTTPS, not arbitrary file:// URLs.

## Project layout

- `index.html`: accessible UI markup
- `styles.css`: responsive styles
- `app.js`: state, translations, and dosage calculations
- `products.json`: detergent data and source links
- `locales/`: language translations
- `manifest.webmanifest`: PWA metadata
- `sw.js`: offline asset caching
- `icons/`: application icon

## License

MIT. Not affiliated with or endorsed by dm or Denkmit.
