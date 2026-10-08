/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-segment (bradescobank.com client segment tiles).
 * Source: section.elementor-element-6ff733d (section.services)
 *   - each tile: direct child a.e-con (id + href) with .title-services p label
 *   - tile image is a CSS background (desk-thumb-discovery-N.jpg), not in the DOM
 * Output (xwalk container cards-segment, child model cards-segment-card):
 *   one row per tile: [image, text] where text = <p><a href>Label</a></p>
 */

// Fallback tile images (CSS backgrounds on the source, keyed by tile id;
// mapping matches the live computed background-image of each tile)
const TILE_IMAGES = {
  private_bank: 'https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-2.jpg',
  personal_bank: 'https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-1.jpg',
  us_residents: 'https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-4.jpg',
  business: 'https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-3.jpg',
};
const TILE_IMAGES_BY_INDEX = Object.values(TILE_IMAGES);

// Elementor background images live in stylesheet rules keyed by the
// .elementor-element-<id> class; use the top-level (desktop) rule so the
// result does not depend on viewport or lazy-load state.
function backgroundUrl(el, document) {
  const pick = (bg) => {
    const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : null;
  };
  const idClass = [...el.classList].find((c) => /^elementor-element-[0-9a-f]{6,}$/.test(c));
  if (idClass && document.styleSheets) {
    const re = new RegExp(`\\.${idClass}(?![\\w-])`);
    for (const sheet of [...document.styleSheets]) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of [...rules]) {
        if (!rule.selectorText || !rule.style) continue;
        const first = rule.selectorText.split(',')[0];
        if (re.test(first) && !/::?(before|after)/.test(first)) {
          const url = pick(rule.style.backgroundImage);
          if (url) return url;
        }
      }
    }
  }
  let bg = el.style && el.style.backgroundImage;
  if ((!bg || bg === 'none') && document.defaultView && document.defaultView.getComputedStyle) {
    try { bg = document.defaultView.getComputedStyle(el).backgroundImage; } catch (e) { bg = ''; }
  }
  return pick(bg);
}

export default function parse(element, { document }) {
  const cells = [];

  // Tiles: direct-child anchors (fallback: any direct child carrying a label)
  let tiles = [...element.querySelectorAll(':scope > a')];
  if (!tiles.length) tiles = [...element.children].filter((c) => c.querySelector('.title-services'));

  tiles.forEach((tile, index) => {
    const labelEl = tile.querySelector('.title-services p, .title-services .elementor-widget-container, p');
    const label = labelEl ? labelEl.textContent.trim() : tile.textContent.trim();
    if (!label) return;

    // Image cell
    let imageCell = '';
    const srcImg = tile.querySelector('img');
    const imgSrc = srcImg ? srcImg.getAttribute('src') : (backgroundUrl(tile, document)
      || TILE_IMAGES[tile.id] || TILE_IMAGES_BY_INDEX[index]);
    if (imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = (srcImg && srcImg.getAttribute('alt')) || label;
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    // Text cell: linked label
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    const p = document.createElement('p');
    const href = tile.getAttribute('href') || (tile.querySelector('a[href]') && tile.querySelector('a[href]').getAttribute('href'));
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      p.appendChild(a);
    } else {
      p.textContent = label;
    }
    textCell.appendChild(p);

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-segment', cells });
  element.replaceWith(block);
}
