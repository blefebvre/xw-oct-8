import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// the source site swaps to its mobile photo below this width
const MOBILE_MEDIA = '(max-width: 767px)';

const isSameOrigin = (src) => new URL(src, window.location.href).origin === window.location.origin;

/**
 * hero-banner: full-width photo page-title banner.
 * Rows: background image (optional), mobile image (optional), rich text (title, optional subtitle).
 * Options (block classes): `left` left-aligns the title; centred by default.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  // the content row is the last row carrying text; image rows come before it
  const contentRow = rows.filter((row) => row.textContent.trim()).pop();
  const imageRows = rows.filter((row) => row !== contentRow);
  const [mediaRow, mobileRow] = imageRows;

  if (mediaRow) mediaRow.className = 'hero-banner-media';
  if (contentRow) contentRow.className = 'hero-banner-content';
  imageRows.slice(2).forEach((row) => { if (!row.querySelector('picture')) row.remove(); });

  // the banner opens the page, so its image is the LCP candidate: load it eagerly
  const desktopImg = mediaRow && mediaRow.querySelector('picture > img');
  let picture = desktopImg && desktopImg.closest('picture');
  if (desktopImg && isSameOrigin(desktopImg.src)) {
    picture = createOptimizedPicture(desktopImg.src, desktopImg.alt, true, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]);
    moveInstrumentation(desktopImg, picture.querySelector('img'));
    desktopImg.closest('picture').replaceWith(picture);
  }

  // optional mobile photo becomes the first <source> of the banner picture
  const mobileImg = mobileRow && mobileRow.querySelector('picture > img');
  if (mobileRow) {
    mobileRow.className = 'hero-banner-mobile';
    mobileRow.hidden = true;
  }
  if (picture && mobileImg) {
    const source = document.createElement('source');
    source.media = MOBILE_MEDIA;
    const url = new URL(mobileImg.src, window.location.href);
    if (isSameOrigin(mobileImg.src)) {
      url.searchParams.set('width', '750');
      url.searchParams.set('format', 'webply');
      url.searchParams.set('optimize', 'medium');
    }
    source.srcset = url.href;
    picture.prepend(source);
  }

  if (!picture) block.classList.add('no-image');
}
