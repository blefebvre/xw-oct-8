/**
 * columns-contact: a media column (photo) beside text columns, with optional
 * follow-up rows (e.g. a note card) placed under the text columns.
 *
 * Authoring: first row holds the cells side by side (image cell + rich-text cells).
 * In later rows, leaving the cell under the image empty lets the photo span those
 * rows; the remaining non-empty cell(s) of the row widen to fill the text columns.
 * @param {Element} block
 */

function isEmptyCell(cell) {
  return !cell.textContent.trim() && !cell.querySelector('picture, img, video, iframe');
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const colCount = Math.max(...rows.map((row) => row.children.length));
  block.classList.add(`columns-contact-${colCount}-cols`);
  block.style.setProperty('--columns-contact-cols', colCount);

  rows.forEach((row) => {
    row.classList.add('columns-contact-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-contact-col');
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1 && !picWrapper.textContent.trim()) {
          // picture is the only content in the column
          picWrapper.classList.add('columns-contact-img-col');
        }
      }
    });
  });

  // the media column of the first row may span the following rows
  const firstCells = [...rows[0].children];
  const mediaIndex = firstCells.findIndex((c) => c.classList.contains('columns-contact-img-col'));
  let span = 1;
  if (mediaIndex >= 0) {
    block.classList.add('columns-contact-has-media');
    block.style.setProperty('--columns-contact-media-col', mediaIndex + 1);
    const mediaCell = firstCells[mediaIndex];
    for (let i = 1; i < rows.length; i += 1) {
      const cell = rows[i].children[mediaIndex];
      if (!cell || !isEmptyCell(cell)) break;
      cell.remove();
      span += 1;
    }
    mediaCell.style.setProperty('--columns-contact-row-span', span);
  }

  // follow-up rows: drop empty cells and widen what is left to fill the row
  rows.slice(1).forEach((row, i) => {
    [...row.children].filter(isEmptyCell).forEach((cell) => cell.remove());
    const remaining = [...row.children];
    if (!remaining.length) {
      row.remove();
      return;
    }
    row.classList.add('columns-contact-extra-row');
    // rows covered by the spanning media cell have one column fewer to fill
    const available = colCount - (i + 1 < span ? 1 : 0);
    if (remaining.length < available) {
      const last = remaining[remaining.length - 1];
      last.classList.add('columns-contact-wide');
      last.style.setProperty('--columns-contact-col-span', available - remaining.length + 1);
    }
  });
}
