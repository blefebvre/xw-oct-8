/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-download (bradescobank.com /en/other-disclosures/ document tiles).
 * Source: .elementor-element-0e286b0
 *   Each tile = one .elementor-widget-text-editor (title) followed in document order by
 *   one .elementor-widget-button (DOWNLOAD link to a PDF). Decorative divider images
 *   (.elementor-widget-image, alt "Divisão") are dropped.
 * Output (xwalk cards-download, 1 column, one row per card, model cards-download-card):
 *   row: <!-- field:text --> title paragraph(s) + <p><a href="...pdf">DOWNLOAD</a></p>
 */

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absoluteHref(href, document) {
  if (!href) return '';
  if (/^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href)) {
    return href.startsWith('//') ? `https:${href}` : href;
  }
  try {
    return new URL(href, 'https://bradescobank.com/').href;
  } catch (e) {
    return href;
  }
}

/** Build title paragraphs from a text-editor widget, keeping <br> line breaks. */
function titleParagraphs(widget, document) {
  const container = widget.querySelector(':scope > .elementor-widget-container') || widget;
  const sources = [...container.querySelectorAll('p, h1, h2, h3, h4, h5, h6')];
  const blocks = sources.length ? sources : [container];
  const out = [];
  blocks.forEach((src) => {
    const p = document.createElement('p');
    // split on <br> to keep the line structure, normalise whitespace within each line
    const lines = [];
    let current = '';
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) current += n.textContent;
        else if (n.nodeType === 1 && n.tagName === 'BR') { lines.push(current); current = ''; }
        else if (n.nodeType === 1) walk(n);
      });
    };
    walk(src);
    lines.push(current);
    const cleaned = lines.map(clean).filter(Boolean);
    cleaned.forEach((line, i) => {
      if (i > 0) p.appendChild(document.createElement('br'));
      p.appendChild(document.createTextNode(line));
    });
    if (cleaned.length) out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  const widgets = [...element.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-button')]
    .filter((w) => !(w.closest && w.closest('.elementor-hidden-desktop')));

  const cells = [];
  let pendingTitle = [];

  widgets.forEach((widget) => {
    if (widget.classList.contains('elementor-widget-text-editor')) {
      pendingTitle = pendingTitle.concat(titleParagraphs(widget, document));
      return;
    }
    const link = widget.querySelector('a[href]');
    if (!link) return;
    const a = document.createElement('a');
    a.href = absoluteHref(link.getAttribute('href'), document);
    a.textContent = clean(link.textContent) || 'DOWNLOAD';
    const ctaP = document.createElement('p');
    ctaP.appendChild(a);

    const textCell = document.createElement('div');
    textCell.appendChild(document.createComment(' field:text '));
    pendingTitle.forEach((p) => textCell.appendChild(p));
    textCell.appendChild(ctaP);
    cells.push([textCell]);
    pendingTitle = [];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-download', cells });
  element.replaceWith(block);
}
