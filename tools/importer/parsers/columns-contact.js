/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-contact (bradescobank.com /en/help/ contact details with photo).
 * Source: .elementor-element-81ae845
 *   - photo container (.elementor-element-2edea40): CSS background on the live page,
 *     materialised as an <img> in the scraped DOM
 *   - text column 1 (.elementor-element-a7cc2c5): BRANCH / HEADQUARTER / CUSTOMER SERVICE
 *   - text column 2 (.elementor-element-399209e): E-MAIL (nested inside column 1's container)
 *   - note card (.protect-account / .elementor-element-6aca6cb)
 * Output (xwalk columns, 3 columns x 2 rows, no field hints for Columns blocks):
 *   row 1: photo | branch/headquarter/customer-service details | e-mail details
 *   row 2: (empty, photo spans) | note card | (empty)
 * Mobile-only duplicates (.elementor-hidden-desktop) are skipped.
 */

const BLOCK_TAGS = new Set(['P', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TABLE']);
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const WIDGETS = '.elementor-widget-text-editor, .elementor-widget-heading';

function pickUrl(bg) {
  if (!bg || bg === 'none') return null;
  const m = bg.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
  return m ? m[1] : null;
}

// Background from the stylesheet rule keyed by .elementor-element-<id>, inline style, or computed.
function backgroundUrl(el, document) {
  const idClass = [...el.classList].find((c) => /^elementor-element-[0-9a-f]{6,}$/.test(c));
  if (idClass && document.styleSheets) {
    const re = new RegExp(`\\.${idClass}(?![\\w-])`);
    for (const sheet of [...document.styleSheets]) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const rule of [...(rules || [])]) {
        if (!rule.selectorText || !rule.style) continue;
        const first = rule.selectorText.split(',')[0];
        if (re.test(first) && !/::?(before|after)/.test(first)) {
          const url = pickUrl(rule.style.backgroundImage || rule.style.background);
          if (url) return url;
        }
      }
    }
  }
  const inline = pickUrl(el.style && (el.style.backgroundImage || el.style.background));
  if (inline) return inline;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    try {
      return pickUrl(document.defaultView.getComputedStyle(el).backgroundImage);
    } catch (e) { /* ignore */ }
  }
  return null;
}

// html2md turns any <img src="*.svg"> into an :icon: token; keep the flags as real images.
function keepSvgAsImage(root) {
  const imgs = root.tagName === 'IMG' ? [root] : [...root.querySelectorAll('img')];
  imgs.forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (/\.svg$/i.test(src)) img.setAttribute('src', `${src}?img=1`);
  });
}

function isMobileOnly(el) {
  return !!(el.closest && el.closest('.elementor-hidden-desktop'));
}

function clean(text) {
  return text.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Convert one Elementor text-editor widget into a list of block-level nodes. */
function widgetContent(widget, document) {
  const container = widget.querySelector(':scope > .elementor-widget-container') || widget;
  const out = [];
  let para = null;

  const flush = () => {
    if (para && (clean(para.textContent) || para.querySelector('img'))) out.push(para);
    para = null;
  };

  [...container.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      if (!clean(node.textContent)) {
        if (para) para.appendChild(document.createTextNode(' '));
        return;
      }
      if (!para) para = document.createElement('p');
      para.appendChild(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1) return;
    if (HEADING_TAGS.has(node.tagName)) {
      flush();
      const h = document.createElement('h3');
      h.textContent = clean(node.textContent);
      if (h.textContent) out.push(h);
      return;
    }
    if (BLOCK_TAGS.has(node.tagName)) {
      flush();
      if (clean(node.textContent) || node.querySelector('img')) out.push(node);
      return;
    }
    // inline element (span, img, a, em, strong, br): collect into a paragraph
    if (!para) para = document.createElement('p');
    para.appendChild(node);
  });
  flush();
  return out;
}

function columnContent(col, document, excludes) {
  if (!col) return [];
  return [...col.querySelectorAll(WIDGETS)]
    .filter((w) => !isMobileOnly(w) && !excludes.some((x) => x && x.contains(w)))
    .flatMap((w) => widgetContent(w, document));
}

export default function parse(element, { document }) {
  // photo
  const photoWrap = element.querySelector('.elementor-element-2edea40')
    || [...element.querySelectorAll(':scope > .e-con')].find((c) => c.querySelector(':scope > img, :scope > picture'));
  let photo = photoWrap ? photoWrap.querySelector('picture, img') : null;
  if (!photo && photoWrap) {
    const src = backgroundUrl(photoWrap, document);
    if (src) {
      photo = document.createElement('img');
      photo.src = src;
      photo.alt = '';
    }
  }

  // note card
  const note = [...element.querySelectorAll('.protect-account, .elementor-element-6aca6cb')]
    .find((n) => !isMobileOnly(n)) || null;

  // text columns (the e-mail column sits inside column 1's container in the source DOM)
  const col1 = element.querySelector('.elementor-element-a7cc2c5');
  const col2 = element.querySelector('.elementor-element-399209e');

  const col1Content = columnContent(col1, document, [col2, note]);
  const col2Content = columnContent(col2, document, [note]);
  const noteContent = note ? columnContent(note, document, []) : [];

  [...col1Content, ...col2Content].forEach((n) => keepSvgAsImage(n));

  const cells = [
    [photo || '', col1Content.length ? col1Content : '', col2Content.length ? col2Content : ''],
    ['', noteContent.length ? noteContent : '', ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-contact', cells });
  element.replaceWith(block);
}
