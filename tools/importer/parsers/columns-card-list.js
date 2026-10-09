/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-card-list (bradescobank.com bank-holidays two-column calendar card).
 * Source: .elementor-element-7f5d2f5
 *   - each direct child container (div.e-con) is one column
 *   - each .elementor-widget-text-editor (.ticker-calendar) inside it is one item:
 *       <h3>Thursday, January 1<br><span>New Year's Day</span></h3>
 * Output (xwalk columns, no field hints): one row, one cell per column; each item is
 * authored as <p>date<br><strong>name</strong></p> (headings are not real headings).
 */

function textOf(nodes) {
  return nodes.map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
}

function buildItem(widget, document) {
  const container = widget.querySelector('.elementor-widget-container') || widget;
  const src = container.querySelector('h1, h2, h3, h4, h5, h6, p') || container;
  if (!src.textContent.trim()) return null;

  let date = '';
  let name = '';
  const nameEl = src.querySelector('span, strong, b');
  if (nameEl) {
    name = nameEl.textContent.replace(/\s+/g, ' ').trim();
    date = textOf([...src.childNodes].filter((n) => n !== nameEl && !(n.contains && n.contains(nameEl))));
  } else {
    const br = src.querySelector('br');
    if (br) {
      const kids = [...src.childNodes];
      const idx = kids.indexOf(br);
      date = textOf(kids.slice(0, idx));
      name = textOf(kids.slice(idx + 1));
    } else {
      date = src.textContent.replace(/\s+/g, ' ').trim();
    }
  }

  const p = document.createElement('p');
  if (date) p.appendChild(document.createTextNode(date));
  if (date && name) p.appendChild(document.createElement('br'));
  if (name) {
    const strong = document.createElement('strong');
    strong.textContent = name;
    p.appendChild(strong);
  }
  return p;
}

export default function parse(element, { document }) {
  let columns = [...element.querySelectorAll(':scope > .e-con')];
  if (!columns.length) columns = [element];

  const row = columns.map((col) => {
    const widgets = [...col.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-heading')];
    const items = widgets.map((w) => buildItem(w, document)).filter(Boolean);
    return items.length ? items : '';
  });

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-card-list', cells });
  element.replaceWith(block);
}
