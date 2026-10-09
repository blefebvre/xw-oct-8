/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-icon (Elementor icon-card grids, e.g. bradescobank.com /en/cra-public-file/).
 * Source: .elementor-element-220b4b9 (10 .box-cra cards spread over nested row containers,
 *   plus empty filler containers that are skipped).
 * Each card = one Elementor container holding, in document order:
 *   - .elementor-widget-image (icon)
 *   - .elementor-widget-text-editor / .elementor-widget-heading (title h3, optional description)
 *   - .elementor-widget-button (VIEW link), often wrapped in a nested child container
 * Card containers are detected generically: .box-cra when present, otherwise the nearest
 * container (.e-con / .elementor-column) of each image/text widget that also holds a button
 * or text widget. Containers with no icon, text or link are dropped.
 * Output (xwalk cards-icon, 2 columns, one row per card, model cards-icon-card):
 *   row: [<!-- field:image --> img] [<!-- field:text --> h3 + p description(s) + p > a CTA]
 */

const WIDGET_SEL = '.elementor-widget-image, .elementor-widget-text-editor, .elementor-widget-heading, .elementor-widget-button';
const CONTAINER_SEL = '.e-con, .elementor-column, .elementor-inner-column';

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(href) {
  if (!href) return '';
  if (/^(mailto|tel|data):/i.test(href) || href.startsWith('#')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  if (/^https?:/i.test(href)) return href;
  if (href.startsWith('./') || href.startsWith('../')) return href; // locally cached assets
  try {
    return new URL(href, 'https://bradescobank.com/').href;
  } catch (e) {
    return href;
  }
}

function isHidden(el) {
  return !!(el.closest && el.closest('.elementor-hidden-desktop'));
}

/** Copy inline content of src into target, normalising whitespace and keeping <br>, links and emphasis. */
function copyInline(src, target, document) {
  const append = (node, parent) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ');
        if (t) parent.appendChild(document.createTextNode(t));
      } else if (n.nodeType === 1) {
        const tag = n.tagName;
        if (tag === 'BR') {
          parent.appendChild(document.createElement('br'));
        } else if (tag === 'A' && n.getAttribute('href')) {
          const a = document.createElement('a');
          a.href = absoluteUrl(n.getAttribute('href'));
          append(n, a);
          if (clean(a.textContent)) parent.appendChild(a);
        } else if (['STRONG', 'B', 'EM', 'I', 'U', 'SUP', 'SUB'].includes(tag)) {
          const el = document.createElement(tag.toLowerCase());
          append(n, el);
          if (clean(el.textContent)) parent.appendChild(el);
        } else {
          append(n, parent);
        }
      }
    });
  };
  append(src, target);
  // trim leading/trailing whitespace text nodes
  const first = target.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = target.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return target;
}

/** Extract text blocks ({ heading: bool, el }) from a text-editor or heading widget. */
function textBlocks(widget, document) {
  const container = widget.querySelector(':scope > .elementor-widget-container') || widget;
  const out = [];
  const sources = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')]
    .filter((n) => !n.parentElement.closest('h1, h2, h3, h4, h5, h6, p, li') || n.parentElement === container);
  const isHeadingWidget = widget.classList.contains('elementor-widget-heading');
  if (!sources.length) {
    if (!clean(container.textContent)) return out;
    const el = document.createElement(isHeadingWidget ? 'h3' : 'p');
    copyInline(container, el, document);
    out.push({ heading: isHeadingWidget, el });
    return out;
  }
  sources.forEach((src) => {
    if (!clean(src.textContent)) return;
    const heading = /^H[1-6]$/.test(src.tagName);
    const el = document.createElement(heading ? 'h3' : 'p');
    copyInline(src, el, document);
    out.push({ heading, el });
  });
  return out;
}

function nearestContainer(widget, root) {
  let node = widget.parentElement;
  while (node && node !== root) {
    if (node.matches && node.matches(CONTAINER_SEL)) return node;
    node = node.parentElement;
  }
  return null;
}

/** Find per-card containers inside the grid root. */
function findCards(root) {
  const explicit = [...root.querySelectorAll('.box-cra')].filter((c) => !isHidden(c));
  if (explicit.length) return explicit;

  // Generic: card = nearest container of an image widget (or of a text widget when no images).
  const images = [...root.querySelectorAll('.elementor-widget-image')].filter((w) => !isHidden(w));
  const anchors = images.length ? images : [...root.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-heading')];
  const cards = [];
  anchors.forEach((w) => {
    const c = nearestContainer(w, root);
    if (c && !cards.includes(c)) cards.push(c);
  });
  // drop containers that wrap other cards (row wrappers)
  return cards.filter((c) => !cards.some((o) => o !== c && c.contains(o)));
}

function buildRow(card, document) {
  const widgets = [...card.querySelectorAll(WIDGET_SEL)].filter((w) => !isHidden(w));

  let img = null;
  const blocks = [];
  const ctas = [];
  widgets.forEach((w) => {
    if (w.classList.contains('elementor-widget-image')) {
      const src = w.querySelector('img');
      if (!img && src && src.getAttribute('src')) {
        img = document.createElement('img');
        img.src = absoluteUrl(src.getAttribute('src'));
        img.alt = clean(src.getAttribute('alt'));
      }
    } else if (w.classList.contains('elementor-widget-button')) {
      const link = w.querySelector('a[href]');
      const label = clean(link ? link.textContent : '');
      if (link && label) {
        const a = document.createElement('a');
        a.href = absoluteUrl(link.getAttribute('href'));
        a.textContent = label;
        const p = document.createElement('p');
        p.appendChild(a);
        ctas.push(p);
      }
    } else {
      textBlocks(w, document).forEach((b) => blocks.push(b));
    }
  });

  if (!img && !blocks.length && !ctas.length) return null; // empty filler container

  // Ensure a title heading: promote the first text block when no heading exists and more follow.
  if (!blocks.some((b) => b.heading) && blocks.length > 1) {
    const h3 = document.createElement('h3');
    copyInline(blocks[0].el, h3, document);
    blocks[0] = { heading: true, el: h3 };
  }

  const imageCell = document.createElement('div');
  imageCell.appendChild(document.createComment(' field:image '));
  if (img) imageCell.appendChild(img);

  const textCell = document.createElement('div');
  textCell.appendChild(document.createComment(' field:text '));
  blocks.forEach((b) => textCell.appendChild(b.el));
  ctas.forEach((p) => textCell.appendChild(p));

  return [imageCell, textCell];
}

export default function parse(element, { document }) {
  const cells = [];
  findCards(element).forEach((card) => {
    const row = buildRow(card, document);
    if (row) cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
