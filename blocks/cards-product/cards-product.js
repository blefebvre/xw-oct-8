import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING = 'h1, h2, h3, h4, h5, h6';

function decorateBody(body) {
  const children = [...body.children];
  const headingIndex = children.findIndex((el) => el.matches(HEADING));
  // a plain paragraph before the heading is the eyebrow
  if (headingIndex > 0) {
    const first = children[0];
    if (first.tagName === 'P' && !first.querySelector('a, img, picture')) first.classList.add('cards-product-eyebrow');
  }
  // paragraphs after the CTA are footnotes
  const ctaIndex = children.findIndex((el) => el.matches('.button-container')
    || (el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'A'
      && el.textContent.trim() === el.firstElementChild.textContent.trim()));
  if (ctaIndex >= 0) {
    children[ctaIndex].classList.add('cards-product-cta');
    children.slice(ctaIndex + 1).forEach((el) => el.classList.add('cards-product-note'));
  }
  // group eyebrow/heading/copy above the CTA (source keeps them in one min-height box)
  const intro = ctaIndex >= 0 ? children.slice(0, ctaIndex) : [];
  if (intro.length) {
    const content = document.createElement('div');
    content.className = 'cards-product-card-content';
    intro[0].before(content);
    content.append(...intro);
  }
  // an inline image/logo in the body (e.g. a brand logo replacing the heading)
  children.forEach((el) => {
    if (el.tagName === 'P' && el.querySelector('img') && !el.textContent.trim()) el.classList.add('cards-product-logo');
  });
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div, i) => {
      const imageOnly = div.querySelector('picture') && !div.textContent.trim();
      // an empty first cell is the unset image field
      if (imageOnly || (i === 0 && li.children.length > 1 && !div.textContent.trim())) {
        div.className = 'cards-product-card-image';
      } else {
        div.className = 'cards-product-card-body';
        decorateBody(div);
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('.cards-product-card-image picture > img').forEach((img) => {
    // only same-origin images can go through the media optimization pipeline
    if (new URL(img.src, window.location.href).origin !== window.location.origin) return;
    const pic = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]);
    moveInstrumentation(img, pic.querySelector('img'));
    img.closest('picture').replaceWith(pic);
  });
  block.replaceChildren(ul);
}
