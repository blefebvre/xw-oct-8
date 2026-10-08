/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-product (bradescobank.com product tiles, two rows of two).
 * Source: .elementor-element-c28d200 / .elementor-element-6cab8f9
 *   - each card: direct child div.e-con.e-child
 *     - :scope > img                                   card image
 *     - .discovery-product widgets                     eyebrow p / h3 title / logo img / description
 *     - :scope > .elementor-widget-button a            CTA
 *     - :scope > .elementor-widget-text-editor         footnote(s) after the CTA (Zelle)
 * Output (xwalk container cards-product, child model cards-product-card):
 *   one row per card: [image, text(richtext)]
 */

function widgetContent(widget, document) {
  const nodes = [];
  const container = widget.querySelector('.elementor-widget-container') || widget;
  if (widget.classList.contains('elementor-widget-image')) {
    const img = container.querySelector('img');
    if (img) {
      const p = document.createElement('p');
      p.appendChild(img);
      nodes.push(p);
    }
    return nodes;
  }
  const blocks = [...container.children].filter((c) => /^(P|H[1-6]|UL|OL)$/.test(c.tagName));
  if (blocks.length) {
    blocks.forEach((b) => {
      if (b.textContent.trim() || b.querySelector('img')) nodes.push(b);
    });
  } else if (container.textContent.trim()) {
    // bare text (e.g. "Send and receive money within minutes<sup>1</sup>")
    const p = document.createElement('p');
    p.innerHTML = container.innerHTML.trim();
    nodes.push(p);
  }
  return nodes;
}

// Card images are Elementor CSS backgrounds on the live page (the scraper
// materialised them as <img>). They live in stylesheet rules keyed by the
// .elementor-element-<id> class and are lazy-loaded, so computed style is unreliable.
function backgroundUrl(el, document) {
  const pick = (bg) => {
    const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : null;
  };
  const idClass = [...el.classList].find((c) => /^elementor-element-[0-9a-f]{6,}$/.test(c));
  if (idClass && document.styleSheets) {
    const re = new RegExp(`\\.${idClass}(?![\\w-])`);
    for (const sheet of [...document.styleSheets]) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of [...rules]) {
        // top-level (desktop) rules only; media-query rules are responsive overrides
        if (!rule.selectorText || !rule.style) continue;
        const first = rule.selectorText.split(',')[0];
        if (re.test(first) && !/::?(before|after)/.test(first)) {
          const url = pick(rule.style.backgroundImage);
          if (url) return url;
        }
      }
    }
  }
  let bg = el.style && el.style.backgroundImage;
  if ((!bg || bg === 'none') && document.defaultView && document.defaultView.getComputedStyle) {
    try { bg = document.defaultView.getComputedStyle(el).backgroundImage; } catch (e) { bg = ''; }
  }
  return pick(bg);
}

export default function parse(element, { document }) {
  const cells = [];

  const cards = [...element.querySelectorAll(':scope > .e-con')];

  cards.forEach((card) => {
    // Image cell
    let imageCell = '';
    let img = card.querySelector(':scope > img') || card.querySelector(':scope > picture img');
    if (!img) {
      const src = backgroundUrl(card, document);
      if (src) {
        img = document.createElement('img');
        img.src = src;
        img.alt = '';
      }
    }
    if (img) {
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    // Text cell
    const textNodes = [];
    const body = card.querySelector('.discovery-product');
    if (body) {
      body.querySelectorAll('.elementor-widget').forEach((widget) => {
        textNodes.push(...widgetContent(widget, document));
      });
    }

    const cta = card.querySelector(':scope > .elementor-widget-button a[href]');
    if (cta) {
      const labelEl = cta.querySelector('.elementor-button-text');
      const label = (labelEl ? labelEl.textContent : cta.textContent).trim();
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = label;
      p.appendChild(a);
      textNodes.push(p);
    }

    // Footnotes after the CTA
    card.querySelectorAll(':scope > .elementor-widget-text-editor').forEach((widget) => {
      textNodes.push(...widgetContent(widget, document));
    });

    let textCell = '';
    if (textNodes.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(' field:text '));
      textNodes.forEach((n) => textCell.appendChild(n));
    }

    if (!imageCell && !textCell) return;
    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
