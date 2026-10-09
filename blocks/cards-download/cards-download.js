import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Returns the last paragraph that holds only a single link (the DOWNLOAD call to action).
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
  if (cta) {
    cta.classList.add('cards-download-cta');
    const link = cta.querySelector('a');
    // documents open in a new tab, as on the source site
    if (link && /\.pdf($|[?#])/i.test(link.getAttribute('href') || '')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  }
  const titleParts = [...body.children].filter((el) => el !== cta);
  if (titleParts.length) {
    const title = document.createElement('div');
    title.className = 'cards-download-card-title';
    titleParts[0].before(title);
    title.append(...titleParts);
  }
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // drop empty cells (e.g. an unset field)
      if (!div.textContent.trim() && !div.querySelector('a')) {
        div.remove();
        return;
      }
      div.className = 'cards-download-card-body';
      decorateBody(div);
    });
    if (li.children.length) ul.append(li);
  });
  block.replaceChildren(ul);
}
