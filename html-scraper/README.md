# HTML Scraper Portal

A small web portal to paste static HTML and extract structured data (links, headings, images, tables) or run custom CSS selectors.

## How to use

1. Open `index.html` in a browser (or serve the folder with any static server).
2. Paste HTML into the text area.
3. Choose an extract mode:
   - **Auto** – extracts links, headings, images, and tables.
   - **Links / Headings / Images / Tables** – only that type.
   - **Custom selector** – enter a CSS selector (e.g. `.title`, `#main p`).
4. Click **Extract data**.
5. View the JSON result and use **Copy JSON** if needed.

## Files

- `index.html` – page layout and form.
- `styles.css` – layout and theme.
- `parser.js` – HTML parsing and extraction (uses the browser’s `DOMParser`).
- `app.js` – UI and result display.

No build step or server required; run locally by opening `index.html`.
