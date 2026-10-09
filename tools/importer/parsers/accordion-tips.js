/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-tips (bradescobank.com /en/security/ "Things you can do to protect yourself").
 * Source: .elementor-element-349fe54.yourself-protect (Elementor accordion widget, 4 items).
 * Each .elementor-accordion-item has .elementor-tab-title (chevron spans + a.elementor-accordion-title)
 * and .elementor-tab-content (rich text).
 * The per-item icon is not in the DOM: it is drawn by stylesheet rules such as
 *   .yourself-protect .elementor-accordion-item [data-tab="1"] a::before { background-image: url(...) }
 * so the parser reads document.styleSheets for those rules (falling back to the known
 * security-page icons when the stylesheets are not available).
 * Output (xwalk accordion-tips, 3 columns, one row per item, model accordion-tips-item):
 *   row: [<!-- field:summary --> title] [<!-- field:text --> body] [<!-- field:image --> icon | empty]
 */

const ICON_BASE = 'https://bradescobank.com/wp-content/uploads/2024/06/';
// Known icons for the .yourself-protect accordion, keyed by data-tab (1-based).
const FALLBACK_ICONS = {
  'yourself-protect': {
    1: `${ICON_BASE}icon-security-1-e1717622897112.png`,
    2: `${ICON_BASE}icon-security-2-e1717622309241.png`,
    3: `${ICON_BASE}icon-security-3-e1717622015213.png`,
    4: `${ICON_BASE}icon-security-4-e1717622080513.png`,
  },
};

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

function pickUrl(value) {
  if (!value || value === 'none') return null;
  const m = value.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
  return m ? m[1] : null;
}

function collectRules(document) {
  const out = [];
  const walk = (rules) => {
    [...(rules || [])].forEach((rule) => {
      if (rule.selectorText && rule.style) out.push(rule);
      else if (rule.cssRules) walk(rule.cssRules);
    });
  };
  [...(document.styleSheets || [])].forEach((sheet) => {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { return; }
    walk(rules);
  });
  return out;
}

/** Map of data-tab -> icon URL drawn by ::before/::after rules scoped to this widget's classes. */
function iconsFromStylesheets(element, document) {
  const scopes = [...element.classList]
    .filter((c) => c === 'yourself-protect' || /^elementor-element-[0-9a-f]{6,}$/.test(c) || !c.startsWith('elementor'))
    .map((c) => new RegExp(`\\.${c.replace(/[-]/g, '\\-')}(?![\\w-])`));
  if (!scopes.length) return {};
  const icons = {};
  collectRules(document).forEach((rule) => {
    rule.selectorText.split(',').forEach((sel) => {
      if (!/::?(before|after)/.test(sel)) return;
      const tab = sel.match(/\[data-tab=["']?(\d+)["']?\]/);
      if (!tab || !scopes.some((re) => re.test(sel))) return;
      const url = pickUrl(rule.style.backgroundImage || rule.style.background) || pickUrl(rule.style.content);
      if (url) icons[tab[1]] = url; // later rules win, as in the cascade
    });
  });
  return icons;
}

function fallbackIcons(element) {
  const key = Object.keys(FALLBACK_ICONS).find((c) => element.classList.contains(c));
  return key ? FALLBACK_ICONS[key] : {};
}

export default function parse(element, { document }) {
  const icons = { ...fallbackIcons(element), ...iconsFromStylesheets(element, document) };
  const items = [...element.querySelectorAll('.elementor-accordion-item')];
  const cells = [];

  items.forEach((item, index) => {
    const titleEl = item.querySelector('.elementor-tab-title');
    const label = clean((item.querySelector('.elementor-accordion-title') || titleEl || {}).textContent);
    const content = item.querySelector('.elementor-tab-content');
    if (!label && !(content && clean(content.textContent))) return;

    const summaryCell = document.createElement('div');
    if (label) {
      summaryCell.appendChild(document.createComment(' field:summary '));
      summaryCell.appendChild(document.createTextNode(label));
    }

    const textCell = document.createElement('div');
    if (content && clean(content.textContent)) {
      textCell.appendChild(document.createComment(' field:text '));
      content.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absoluteUrl(a.getAttribute('href'))));
      [...content.childNodes].forEach((n) => {
        if (n.nodeType === 3 && !clean(n.textContent)) return;
        if (n.nodeType === 3) {
          const p = document.createElement('p');
          p.textContent = clean(n.textContent);
          textCell.appendChild(p);
        } else if (n.nodeType === 1) {
          textCell.appendChild(n);
        }
      });
    }

    const tab = (titleEl && titleEl.getAttribute('data-tab')) || String(index + 1);
    const iconCell = document.createElement('div');
    const iconUrl = icons[tab];
    if (iconUrl) {
      const img = document.createElement('img');
      img.src = absoluteUrl(iconUrl);
      img.alt = '';
      iconCell.appendChild(document.createComment(' field:image '));
      iconCell.appendChild(img);
    }

    cells.push([summaryCell, textCell, iconCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-tips', cells });
  element.replaceWith(block);
}
