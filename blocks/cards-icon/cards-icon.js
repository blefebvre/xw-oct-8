import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Returns the last element of the body that holds only a single link (the VIEW call to action).
 * @param {Element} body card body cell
 * @returns {Element|undefined}
 */
function findCta(body) {
  const candidates = [...body.children].filter((el) => {
    if (el.classList.contains('button-container')) return true;
    if (el.tagName !== 'P') return false;
    const link = el.querySelector('a');
    return link && el.textContent.trim() === link.textContent.trim();
  });
  return candidates.pop();
}

function decorateBody(body) {
  const cta = findCta(body);
  if (!cta) return;
  cta.classList.add('cards-icon-cta');
  const link = cta.querySelector('a');
  // documents open in a new tab, as on the source site
  if (link && /\.pdf($|[?#])/i.test(link.getAttribute('href') || '')) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
}

function isImageCell(div) {
  return div.querySelector('picture, img') && !div.textContent.trim();
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (isImageCell(div)) {
        div.className = 'cards-icon-card-image';
      } else if (!div.textContent.trim() && !div.querySelector('a')) {
        // drop empty cells (e.g. an unset icon field)
        div.remove();
      } else {
        div.className = 'cards-icon-card-body';
        decorateBody(div);
      }
    });
    if (li.children.length) ul.append(li);
  });

  ul.querySelectorAll('.cards-icon-card-image img').forEach((img) => {
    // small line icons: keep SVGs as-is, optimize raster icons at a small width
    if (/\.svg($|[?#])/i.test(img.getAttribute('src') || '')) return;
    // only same-origin images can go through the media optimization pipeline
    if (new URL(img.src, window.location.href).origin !== window.location.origin) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '120' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture')?.replaceWith(optimizedPic);
  });

  block.replaceChildren(ul);
}
