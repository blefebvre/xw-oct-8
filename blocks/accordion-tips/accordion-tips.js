/*
 * accordion-tips: separate shadowed expandable panels, each title optionally led by an
 * icon image and followed by a chevron. The first item is open by default.
 *
 * Row cells: label, body, then an optional icon image (UE fields summary, text, image).
 * The icon cell is recognised by content (a picture with no text) wherever it sits,
 * so rows authored without an icon (two cells) work too.
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function isImageCell(cell) {
  return cell.querySelector('picture, img') && !cell.textContent.trim();
}

function isEmptyCell(cell) {
  return !cell.textContent.trim() && !cell.querySelector('picture, img, a');
}

function optimizeIcon(img) {
  if (/\.svg($|[?#])/i.test(img.getAttribute('src') || '')) return;
  if (new URL(img.src, window.location.href).origin !== window.location.origin) return;
  const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '120' }]);
  moveInstrumentation(img, optimizedPic.querySelector('img'));
  img.closest('picture')?.replaceWith(optimizedPic);
}

// source: jQuery slideDown/slideUp, 400ms "swing" (easeInOutSine)
const SLIDE_MS = 400;
const SLIDE_EASING = 'cubic-bezier(0.37, 0, 0.63, 1)';
const ACTIVE = 'accordion-tips-item-active';

function slide(details, open) {
  const body = details.querySelector(':scope > .accordion-tips-item-body');
  body?.getAnimations().forEach((a) => a.cancel());
  if (open) details.open = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!body || reduce) {
    details.open = open;
    return;
  }
  const cs = getComputedStyle(body);
  const full = { height: cs.height, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom };
  const zero = { height: '0px', paddingTop: '0px', paddingBottom: '0px' };
  body.classList.add('accordion-tips-animating');
  const anim = body.animate(open ? [zero, full] : [full, zero], {
    duration: SLIDE_MS,
    easing: SLIDE_EASING,
  });
  anim.onfinish = () => {
    body.classList.remove('accordion-tips-animating');
    if (!open) details.open = false;
  };
  anim.oncancel = () => body.classList.remove('accordion-tips-animating');
}

function toggle(block, details) {
  const opening = !details.classList.contains(ACTIVE);
  // one item open at a time; clicking the open item closes it
  block.querySelectorAll(`:scope > details.${ACTIVE}`).forEach((other) => {
    if (other === details) return;
    other.classList.remove(ACTIVE);
    slide(other, false);
  });
  details.classList.toggle(ACTIVE, opening);
  slide(details, opening);
}

export default function decorate(block) {
  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    const iconCell = cells.find(isImageCell);
    // an unset icon field leaves an empty trailing cell; label and body keep authored order
    const textCells = cells.filter((c) => c !== iconCell);
    while (textCells.length > 2 && isEmptyCell(textCells[textCells.length - 1])) textCells.pop();
    const [label, body] = textCells;

    const summary = document.createElement('summary');
    summary.className = 'accordion-tips-item-label';

    if (iconCell) {
      const icon = document.createElement('span');
      icon.className = 'accordion-tips-item-icon';
      const picture = iconCell.querySelector('picture') || iconCell.querySelector('img');
      icon.append(picture);
      summary.append(icon);
      summary.classList.add('accordion-tips-has-icon');
    }

    const title = document.createElement('span');
    title.className = 'accordion-tips-item-title';
    if (label) {
      // unwrap a single paragraph so the title stays inline
      const only = label.children.length === 1 && label.firstElementChild.tagName === 'P'
        ? label.firstElementChild : label;
      title.append(...only.childNodes);
    }
    summary.append(title);

    const content = body || document.createElement('div');
    content.className = 'accordion-tips-item-body';

    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = 'accordion-tips-item';
    if (index === 0) {
      details.open = true;
      details.classList.add(ACTIVE);
    }
    details.append(summary, content);
    // keep the active state in sync when the browser opens an item (e.g. find-in-page)
    details.addEventListener('toggle', () => {
      if (details.open && !details.classList.contains(ACTIVE)) toggle(block, details);
    });
    row.replaceWith(details);
  });

  block.addEventListener('click', (e) => {
    const summary = e.target.closest('summary');
    if (!summary || summary.parentElement?.parentElement !== block) return;
    e.preventDefault();
    toggle(block, summary.parentElement);
  });

  block.querySelectorAll('.accordion-tips-item-icon img').forEach(optimizeIcon);
}
