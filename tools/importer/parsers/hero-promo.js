/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-promo (bradescobank.com "Exclusive Content for You" banner).
 * Source: .elementor-element-f4e421d
 *   - background image: Elementor CSS background on the container (bg-Exclusive-1.jpg);
 *     the scraper materialised it as a direct-child <img>
 *   - .elementor-widget-text-editor h3 / p, .elementor-widget-button a (CTA)
 * Output (xwalk model hero-promo): row 1 = image, row 2 = text (richtext).
 */

// Elementor background images live in stylesheet rules keyed by the
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
  // Row 1: background image
  let imageCell = '';
  let img = element.querySelector(':scope > img') || element.querySelector(':scope > picture img');
  if (!img) {
    const src = backgroundUrl(element, document);
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

  // Row 2: text - heading, description, CTA (document order)
  const textNodes = [];
  element.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-heading, .elementor-widget-button').forEach((widget) => {
    if (widget.classList.contains('elementor-widget-button')) {
      const cta = widget.querySelector('a[href]');
      if (!cta) return;
      const labelEl = cta.querySelector('.elementor-button-text');
      const label = (labelEl ? labelEl.textContent : cta.textContent).trim();
      if (!label) return;
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = label;
      p.appendChild(a);
      textNodes.push(p);
      return;
    }
    const container = widget.querySelector('.elementor-widget-container') || widget;
    const blocks = [...container.children].filter((c) => /^(P|H[1-6]|UL|OL)$/.test(c.tagName));
    if (blocks.length) {
      blocks.forEach((b) => { if (b.textContent.trim()) textNodes.push(b); });
    } else if (container.textContent.trim()) {
      const p = document.createElement('p');
      p.innerHTML = container.innerHTML.trim();
      textNodes.push(p);
    }
  });

  let textCell = '';
  if (textNodes.length) {
    textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textCell.appendChild(n));
  }

  const cells = [
    [imageCell],
    [textCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
