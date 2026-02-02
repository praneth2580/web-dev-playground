/**
 * HTML Scraper Portal - App
 * UI logic and result rendering.
 */

(function () {
  'use strict';

  const Parser = window.HTMLScraperParser;
  if (!Parser) return;

  const htmlInput = document.getElementById('html-input');
  const extractMode = document.getElementById('extract-mode');
  const customSelectorWrap = document.getElementById('custom-selector-wrap');
  const customSelector = document.getElementById('custom-selector');
  const btnExtract = document.getElementById('btn-extract');
  const outputPlaceholder = document.getElementById('output-placeholder');
  const outputContent = document.getElementById('output-content');
  const outputTables = document.getElementById('output-tables');
  const btnCopy = document.getElementById('btn-copy');
  const rendererPlaceholder = document.getElementById('renderer-placeholder');
  const rendererWrap = document.getElementById('renderer-wrap');
  const rendererFrame = document.getElementById('renderer-frame');
  const btnRender = document.getElementById('btn-render');

  function updateRenderer(html) {
    if (!html || !html.trim()) {
      rendererPlaceholder.classList.remove('hidden');
      rendererWrap.classList.add('hidden');
      return;
    }
    rendererPlaceholder.classList.add('hidden');
    rendererWrap.classList.remove('hidden');
    rendererFrame.srcdoc = html;
  }

  function toggleCustomSelector() {
    const isCustom = extractMode.value === 'custom';
    customSelectorWrap.classList.toggle('hidden', !isCustom);
  }

  extractMode.addEventListener('change', toggleCustomSelector);
  toggleCustomSelector();

  function showError(message) {
    outputPlaceholder.classList.remove('hidden');
    outputPlaceholder.textContent = message;
    outputPlaceholder.style.color = '#f87171';
    outputContent.classList.add('hidden');
    outputTables.classList.add('hidden');
    btnCopy.classList.add('hidden');
  }

  function showResult(data, options) {
    outputPlaceholder.classList.add('hidden');
    outputPlaceholder.style.color = '';
    btnCopy.classList.remove('hidden');

    const hasTables = options.mode === 'auto' && data.tables?.length > 0;
    const hasTablesOnly = options.mode === 'tables' && data.tables?.length > 0;

    if (hasTables || hasTablesOnly) {
      outputContent.classList.add('hidden');
      outputTables.classList.remove('hidden');
      renderTables(data.tables);
      outputContent.textContent = JSON.stringify(data, null, 2);
    } else {
      outputTables.classList.add('hidden');
      outputContent.classList.remove('hidden');
      outputContent.textContent = JSON.stringify(data, null, 2);
    }
  }

  function renderTables(tables) {
    outputTables.innerHTML = '';
    tables.forEach((t, i) => {
      const caption = document.createElement('div');
      caption.className = 'table-caption';
      caption.textContent = 'Table ' + (i + 1);
      outputTables.appendChild(caption);

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tbody = document.createElement('tbody');

      t.rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell) => {
          const cellEl = document.createElement(rowIndex === 0 ? 'th' : 'td');
          cellEl.textContent = cell;
          tr.appendChild(cellEl);
        });
        (rowIndex === 0 ? thead : tbody).appendChild(tr);
      });

      table.appendChild(thead);
      if (tbody.children.length) table.appendChild(tbody);
      outputTables.appendChild(table);
    });
  }

  function runExtract() {
    const html = htmlInput.value?.trim();
    if (!html) {
      showError('Please paste some HTML first.');
      return;
    }

    const mode = extractMode.value;
    const customSel = customSelector.value?.trim();

    try {
      const data = Parser.scrape(html, { mode, customSelector: customSel });
      showResult(data, { mode });
      updateRenderer(html);
    } catch (err) {
      showError(err.message || 'Failed to parse HTML.');
    }
  }

  btnExtract.addEventListener('click', runExtract);

  if (btnRender) {
    btnRender.addEventListener('click', function () {
      updateRenderer(htmlInput.value?.trim() || '');
    });
  }

  btnCopy.addEventListener('click', function () {
    const text = outputContent.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      function () {
        const label = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        setTimeout(function () {
          btnCopy.textContent = label;
        }, 1500);
      },
      function () {
        btnCopy.textContent = 'Copy failed';
        setTimeout(function () {
          btnCopy.textContent = 'Copy JSON';
        }, 1500);
      }
    );
  });
})();
