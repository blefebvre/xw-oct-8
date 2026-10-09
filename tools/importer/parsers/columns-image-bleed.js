/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-image-bleed (bradescobank.com /en/security/ "Avoid fraud").
 * Source: .elementor-element-5358476 with two child containers:
 *   - photo container (.elementor-element-98d6419): CSS background on the live page
 *     (desktop rule outside media queries), materialised as an <img> in the scraped DOM
 *   - text container (.elementor-element-a35c121): "Avoid fraud" lead text + paragraphs
 * Output (xwalk columns, 2 columns x 1 row, no field hints for Columns blocks):
 *   row: photo | <p><strong>Avoid fraud</strong></p> + paragraphs
 */

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(href) {
  if (!href) return '';
  if (/^(mailto|tel|data):/i.test(href) || href.startsWith('#')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  if (/^https?:/i.test(href)) return href;
  if (href.startsWith('./') || href.startsWith('../')) return href;
  try {
    return new URL(href, 'https://bradescobank.com/').href;
  } catch (e) {
    return href;
  }
}

function pickUrl(bg) {
  if (!bg || bg === 'none') return null;
  const m = bg.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
  return m ? m[1] : null;
}

// Desktop background: top-level stylesheet rule keyed by .elementor-element-<id>, else inline, else computed.
function backgroundUrl(el, document) {
  const idClass = [...el.classList].find((c) => /^elementor-element-[0-9a-f]{6,}$/.test(c));
  if (idClass && document.styleSheets) {
    const re = new RegExp(`\\.${idClass}(?![\\w-])`);
    for (const sheet of [...document.styleSheets]) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const rule of [...(rules || [])]) {
        if (!rule.selectorText || !rule.style) continue; // skips @media (non-desktop) rules
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

function isHidden(el) {
  return !!(el.closest && el.closest('.elementor-hidden-desktop'));
}

export default function parse(element, { document }) {
  const children = [...element.children].filter((c) => c.matches('.e-con') && !isHidden(c));
  const photoWrap = element.querySelector('.elementor-element-98d6419')
    || children.find((c) => !c.querySelector('.elementor-widget-text-editor, .elementor-widget-heading'))
    || null;
  const textWrap = element.querySelector('.elementor-element-a35c121')
    || children.find((c) => c !== photoWrap)
    || null;

  // photo cell
  let photo = null;
  if (photoWrap) {
    const src = photoWrap.querySelector('img');
    const url = (src && src.getAttribute('src')) || backgroundUrl(photoWrap, document);
    if (url) {
      photo = document.createElement('img');
      photo.src = absoluteUrl(url);
      photo.alt = clean(src && src.getAttribute('alt'));
    }
  }

  // text cell: first widget is the lead ("Avoid fraud") rendered as a bold paragraph
  const textCell = [];
  if (textWrap) {
    const widgets = [...textWrap.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-heading')]
      .filter((w) => !isHidden(w));
    widgets.forEach((w, wi) => {
      const container = w.querySelector(':scope > .elementor-widget-container') || w;
      const blocks = [...container.children].filter((n) => clean(n.textContent));
      if (wi === 0) {
        const lead = clean(container.textContent);
        if (lead) {
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          strong.textContent = lead;
          p.appendChild(strong);
          textCell.push(p);
        }
        return;
      }
      if (!blocks.length && clean(container.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(container.textContent);
        textCell.push(p);
        return;
      }
      blocks.forEach((n) => {
        n.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absoluteUrl(a.getAttribute('href'))));
        textCell.push(n);
      });
    });
  }

  const cells = [[photo || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-image-bleed', cells });
  element.replaceWith(block);
}
