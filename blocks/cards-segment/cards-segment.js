import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div, i) => {
      const imageOnly = div.querySelector('picture') && !div.textContent.trim();
      // an empty first cell is the unset image field
      if (imageOnly || (i === 0 && li.children.length > 1 && !div.textContent.trim())) div.className = 'cards-segment-card-image';
      else div.className = 'cards-segment-card-body';
    });
    // the first link in the body makes the whole tile clickable (stretched via CSS)
    const link = li.querySelector('.cards-segment-card-body a[href]');
    if (link) {
      li.classList.add('is-linked');
      link.classList.remove('button');
      link.closest('.button-container')?.classList.remove('button-container');
    }
    ul.append(li);
  });
  ul.querySelectorAll('.cards-segment-card-image picture > img').forEach((img) => {
    // only same-origin images can go through the media optimization pipeline
    if (new URL(img.src, window.location.href).origin !== window.location.origin) return;
    const pic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, pic.querySelector('img'));
    img.closest('picture').replaceWith(pic);
  });
  block.replaceChildren(ul);
}
