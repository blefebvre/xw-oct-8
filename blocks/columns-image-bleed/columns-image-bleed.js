/*
 * columns-image-bleed: one photo column that bleeds to the viewport edge beside one
 * text column. The photo normally sits first (bleeds left); if authored second it
 * bleeds right.
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-image-bleed-row');
    const cols = [...row.children];
    cols.forEach((col, i) => {
      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1 && !col.textContent.trim()) {
        col.className = 'columns-image-bleed-img-col';
        if (i > 0) row.classList.add('columns-image-bleed-img-end');
        const img = pic.querySelector('img');
        // only same-origin images can go through the media optimization pipeline
        if (img && new URL(img.src, window.location.href).origin === window.location.origin) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [
            { media: '(min-width: 900px)', width: '1200' },
            { width: '750' },
          ]);
          moveInstrumentation(img, optimized.querySelector('img'));
          pic.replaceWith(optimized);
        }
      } else {
        col.className = 'columns-image-bleed-text-col';
      }
    });
  });
}
