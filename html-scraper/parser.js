/**
 * HTML Scraper Portal - Parser
 * Parses static HTML string and extracts structured data.
 */

(function (global) {
  'use strict';

  function parseHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc;
  }

  function extractLinks(doc) {
    const links = [];
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href')?.trim();
      const text = a.textContent?.trim() || '';
      if (href) links.push({ href, text });
    });
    return links;
  }

  function extractHeadings(doc) {
    const headings = [];
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
      headings.push({
        tag: el.tagName.toLowerCase(),
        level: parseInt(el.tagName.charAt(1), 10),
        text: el.textContent?.trim() || '',
      });
    });
    return headings;
  }

  function extractImages(doc) {
    const images = [];
    doc.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src')?.trim();
      const alt = img.getAttribute('alt')?.trim() || '';
      if (src) images.push({ src, alt });
    });
    return images;
  }

  function extractTables(doc) {
    const tables = [];
    doc.querySelectorAll('table').forEach((table, index) => {
      const rows = [];
      table.querySelectorAll('tr').forEach((tr) => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach((cell) => {
          cells.push(cell.textContent?.trim()?.replace(/\s+/g, ' ') || '');
        });
        if (cells.length) rows.push(cells);
      });
      if (rows.length) tables.push({ index: index + 1, rows });
    });
    return tables;
  }

  function extractCustom(doc, selector) {
    if (!selector || !selector.trim()) return [];
    const results = [];
    try {
      doc.querySelectorAll(selector).forEach((el, i) => {
        results.push({
          index: i + 1,
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim()?.replace(/\s+/g, ' ') || '',
          html: el.outerHTML?.slice(0, 500) || '',
        });
      });
    } catch (e) {
      throw new Error('Invalid selector: ' + e.message);
    }
    return results;
  }

  function extractAll(doc) {
    return {
      links: extractLinks(doc),
      headings: extractHeadings(doc),
      images: extractImages(doc),
      tables: extractTables(doc),
    };
  }

  function scrape(htmlString, options) {
    options = options || {};
    const mode = options.mode || 'auto';
    const customSelector = options.customSelector || '';

    const doc = parseHTML(htmlString);

    switch (mode) {
      case 'links':
        return { links: extractLinks(doc) };
      case 'headings':
        return { headings: extractHeadings(doc) };
      case 'images':
        return { images: extractImages(doc) };
      case 'tables':
        return { tables: extractTables(doc) };
      case 'custom':
        return { custom: extractCustom(doc, customSelector) };
      default:
        return extractAll(doc);
    }
  }

  global.HTMLScraperParser = {
    parseHTML,
    scrape,
    extractLinks,
    extractHeadings,
    extractImages,
    extractTables,
    extractCustom,
    extractAll,
  };
})(typeof window !== 'undefined' ? window : this);
