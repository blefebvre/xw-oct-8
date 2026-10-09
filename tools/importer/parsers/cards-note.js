/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-note (bradescobank.com /en/security/ shadowed text notes).
 * Source instances: .elementor-element-a2edf52 (2 text cards), .elementor-element-ebf86a1 (1 text card),
 *   .elementor-element-ba0258e (3 cards with an icon image each).
 * Each card is a .protect-account container holding an optional .elementor-widget-image (icon)
 * and one or more .elementor-widget-text-editor widgets.
 * Output (xwalk cards-note, 2 columns, one row per card, model cards-note-card):
 *   row: [<!-- field:image --> img | empty] [<!-- field:text --> rich text]
 */

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

/** Block-level content of a text-editor widget (paragraphs, lists, headings). */
function widgetContent(widget, document) {
  const container = widget.querySelector(':scope > .elementor-widget-container') || widget;
  const out = [];
  let para = null;
  const flush = () => {
    if (para && clean(para.textContent)) out.push(para);
    para = null;
  };
  [...container.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      if (!clean(node.textContent)) return;
      if (!para) para = document.createElement('p');
      para.appendChild(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1) return;
    if (/^(P|UL|OL|H[1-6]|BLOCKQUOTE)$/.test(node.tagName)) {
      flush();
      if (!clean(node.textContent)) return;
      node.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absoluteUrl(a.getAttribute('href'))));
      out.push(node);
      return;
    }
    if (!para) para = document.createElement('p');
    para.appendChild(node);
  });
  flush();
  return out;
}

export default function parse(element, { document }) {
  const cards = [...element.querySelectorAll('.protect-account')].filter((c) => !isHidden(c));
  const cells = [];

  cards.forEach((card) => {
    // only widgets that belong to this card (guards against nested .protect-account containers)
    const own = (w) => w.closest('.protect-account') === card && !isHidden(w);

    const srcImg = [...card.querySelectorAll('.elementor-widget-image img')].find(own);
    const texts = [...card.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-heading')]
      .filter(own)
      .flatMap((w) => widgetContent(w, document));

    if (!srcImg && !texts.length) return;

    const imageCell = document.createElement('div');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = absoluteUrl(srcImg.getAttribute('src'));
      img.alt = clean(srcImg.getAttribute('alt'));
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    const textCell = document.createElement('div');
    if (texts.length) {
      textCell.appendChild(document.createComment(' field:text '));
      texts.forEach((n) => textCell.appendChild(n));
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-note', cells });
  element.replaceWith(block);
}
