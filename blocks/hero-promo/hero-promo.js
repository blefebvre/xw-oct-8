import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  // the content row is the last row carrying text; the media row is the (possibly empty) image row
  const contentRow = rows.filter((row) => row.textContent.trim()).pop();
  const mediaRow = rows.find((row) => row !== contentRow);

  if (mediaRow) mediaRow.className = 'hero-promo-media';
  if (contentRow) contentRow.className = 'hero-promo-content';
  if (!mediaRow?.querySelector('picture')) block.classList.add('no-image');

  block.querySelectorAll('.hero-promo-media picture > img').forEach((img) => {
    // only same-origin images can go through the media optimization pipeline
    if (new URL(img.src, window.location.href).origin !== window.location.origin) return;
    const pic = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]);
    moveInstrumentation(img, pic.querySelector('img'));
    img.closest('picture').replaceWith(pic);
  });
}
