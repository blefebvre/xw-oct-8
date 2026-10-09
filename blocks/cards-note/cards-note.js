import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * cards-note: separate shadowed text notes with a gradient bar on the left edge.
 * Text-only cards sit two per row (an odd last card in a run spans the row);
 * cards with an icon image sit one per row with the icon left of the text.
 */

function isImageCell(div) {
  return div.querySelector('picture, img') && !div.textContent.trim();
}

function isEmptyCell(div) {
  return !div.textContent.trim() && !div.querySelector('picture, img, a');
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (isImageCell(div)) {
        div.className = 'cards-note-card-image';
      } else if (isEmptyCell(div)) {
        // drop empty cells (e.g. an unset icon field)
        div.remove();
      } else {
        div.className = 'cards-note-card-body';
      }
    });
    if (!li.children.length) return;
    if (li.querySelector('.cards-note-card-image')) li.classList.add('cards-note-has-icon');
    ul.append(li);
  });

  // in each run of consecutive text-only cards, an odd last card spans the full row
  let run = [];
  const closeRun = () => {
    if (run.length % 2 === 1) run[run.length - 1].classList.add('cards-note-wide');
    run = [];
  };
  [...ul.children].forEach((li) => {
    if (li.classList.contains('cards-note-has-icon')) closeRun();
    else run.push(li);
  });
  closeRun();

  ul.querySelectorAll('.cards-note-card-image img').forEach((img) => {
    // small icons: keep SVGs as-is; only same-origin rasters go through optimization
    if (/\.svg($|[?#])/i.test(img.getAttribute('src') || '')) return;
    if (new URL(img.src, window.location.href).origin !== window.location.origin) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '120' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture')?.replaceWith(optimizedPic);
  });

  block.replaceChildren(ul);
}
