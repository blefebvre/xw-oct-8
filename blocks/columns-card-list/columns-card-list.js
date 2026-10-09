/**
 * columns-card-list: side-by-side lists of short items (e.g. date + title) inside a
 * centred white card, with a vertical rule between columns and a dash before each item.
 * Each cell is a rich-text column; each paragraph or list item in it is one list item.
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-card-list-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-card-list-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-card-list-col');
      // cells without wrapper elements (plain text) still render as one item
      if (!col.children.length && col.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...col.childNodes);
        col.append(p);
      }
      col.querySelectorAll(':scope > p, :scope > ul > li, :scope > ol > li').forEach((item) => {
        if (item.textContent.trim()) item.classList.add('columns-card-list-item');
      });
    });
  });
}
