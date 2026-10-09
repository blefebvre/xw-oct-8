/**
 * Loads the footer fragment. Metadata-independent: /content first (local preview),
 * then the site root (DA/EDS).
 * @returns {Promise<Element|null>} wrapper containing the fragment sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location
  const base = new URL(resp.url);
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
  });
  return wrapper;
}

/**
 * Groups each heading with the content that follows it into a column.
 * @param {Element} section fragment section
 * @returns {Element} column container
 */
function buildColumns(section) {
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let column = null;
  [...section.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName) || !column) {
      column = document.createElement('div');
      column.className = 'footer-column';
      columns.append(column);
    }
    column.append(el);
  });
  // a list made only of image links renders as an icon row
  columns.querySelectorAll('ul').forEach((ul) => {
    const items = [...ul.children];
    if (items.length && items.every((li) => li.querySelector('a img') && !li.textContent.trim())) {
      ul.classList.add('footer-icons');
    }
  });
  return columns;
}

/**
 * Logo strip: the linked image (inside the link, or in the paragraph just before
 * it) becomes the brand logo; the remaining images form a badge row with thin
 * dividers. Works whether images sit inside links or in their own paragraphs.
 * @param {Element} container logo strip content
 */
function buildLogoStrip(container) {
  const imgs = [...container.querySelectorAll('img')];
  const link = container.querySelector('a');
  let logo = link ? link.querySelector('img') : imgs[0];
  if (link && !logo) {
    // image authored in the paragraph right before the link paragraph
    const prev = link.closest('p') && link.closest('p').previousElementSibling;
    logo = prev && !prev.textContent.trim() ? prev.querySelector('img') : null;
  }
  const badges = imgs.filter((img) => img !== logo);
  const brand = document.createElement('p');
  brand.className = 'footer-brand';
  if (logo || link) {
    if (link) {
      const label = link.textContent.trim();
      if (label) link.setAttribute('aria-label', label);
      link.textContent = '';
      if (logo) link.append(logo);
      brand.append(link);
    } else {
      brand.append(logo);
    }
  }
  const row = document.createElement('p');
  row.className = 'footer-badges';
  badges.forEach((img, i) => {
    if (i) {
      const divider = document.createElement('span');
      divider.className = 'footer-divider';
      divider.setAttribute('aria-hidden', 'true');
      row.append(divider);
    }
    row.append(img);
  });
  container.replaceChildren(brand, row);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  // sections in order: link columns, legal copy, logo strip
  const roles = ['footer-links', 'footer-legal', 'footer-logos'];
  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  sections.forEach((section, i) => {
    const wrap = document.createElement('div');
    wrap.className = `footer-section ${roles[i] || ''}`.trim();
    const inner = document.createElement('div');
    inner.className = 'footer-section-inner';
    if (i === 0) inner.append(buildColumns(section));
    else inner.append(...section.childNodes);
    wrap.append(inner);
    footer.append(wrap);
  });

  const logos = footer.querySelector('.footer-logos .footer-section-inner');
  if (logos) buildLogoStrip(logos);

  // authors mark new-tab links with a trailing #_blank
  footer.querySelectorAll('a[href$="#_blank"]').forEach((a) => {
    a.href = a.href.replace(/#_blank$/, '');
    a.target = '_blank';
    a.rel = 'noopener';
  });

  block.append(footer);
}
