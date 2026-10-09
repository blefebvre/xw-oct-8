/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner (bradescobank.com photo page-title banner, reused on ~17 pages).
 * Source (e.g. bank-holidays .elementor-element-1c4cdd8): an Elementor container whose
 * background photo is either
 *   - a materialised <img> child (direct, inside <picture>, or an image widget), or
 *   - a CSS background-image (stylesheet rule keyed by .elementor-element-<id>, inline style,
 *     or computed style)
 * plus a text-editor / heading widget holding the H1 and an optional subtitle paragraph.
 * The desktop image is preferred (mobile variants / @media overrides are ignored).
 * Output (xwalk model hero-banner): row 1 = image (field image), row 2 = text (field text).
 */

const MOBILE_RE = /(^|[-_./\s])(mob|mobile|mobi|phone|sm|xs)([-_./\s0-9]|$)/i;

function pickUrl(bg) {
  if (!bg || bg === 'none') return null;
  const m = bg.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
  return m ? m[1] : null;
}

// Background from the stylesheet rule keyed by .elementor-element-<id>.
// Desktop: top-level rules only. Mobile: rules inside a max-width (<= 767px) media query.
function stylesheetBackground(el, document, mobile = false) {
  const idClass = [...el.classList].find((c) => /^elementor-element-[0-9a-f]{6,}$/.test(c));
  if (!idClass || !document.styleSheets) return null;
  const re = new RegExp(`\\.${idClass}(?![\\w-])`);
  const isMobileMedia = (text) => {
    const m = /max-width:\s*(\d+)px/.exec(text || '');
    return !!m && +m[1] <= 767 && !/min-width/.test(text);
  };
  let found = null;
  const visit = (rules, media) => {
    for (const rule of [...rules]) {
      if (found) return;
      if (rule.cssRules && rule.media) { visit(rule.cssRules, rule.media.mediaText); continue; }
      if (!rule.selectorText || !rule.style) continue;
      if (mobile ? !isMobileMedia(media) : media) continue;
      const first = rule.selectorText.split(',')[0];
      if (re.test(first) && !/::?(before|after)/.test(first)) {
        const url = pickUrl(rule.style.backgroundImage || rule.style.background);
        if (url) found = url;
      }
    }
  };
  for (const sheet of [...document.styleSheets]) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    if (rules) visit(rules, '');
    if (found) return found;
  }
  return null;
}

function backgroundUrl(el, document) {
  const fromSheet = stylesheetBackground(el, document);
  if (fromSheet) return fromSheet;
  const inline = el.style && (el.style.backgroundImage || el.style.background);
  const fromInline = pickUrl(inline);
  if (fromInline) return fromInline;
  const dataSettings = el.getAttribute && el.getAttribute('data-settings');
  if (dataSettings) {
    try {
      const s = JSON.parse(dataSettings);
      const slide = s && s.background_slideshow_gallery && s.background_slideshow_gallery[0];
      if (slide && slide.url) return slide.url;
    } catch (e) { /* ignore */ }
  }
  if (document.defaultView && document.defaultView.getComputedStyle) {
    try {
      return pickUrl(document.defaultView.getComputedStyle(el).backgroundImage);
    } catch (e) { /* ignore */ }
  }
  return null;
}

function isMobileImg(img) {
  const cls = `${img.className || ''} ${(img.closest('[class]') || {}).className || ''}`;
  if (/elementor-hidden-desktop/.test(cls)) return true;
  const src = img.getAttribute('src') || '';
  const file = src.split('?')[0].split('/').pop() || '';
  return MOBILE_RE.test(file);
}

function isInTextWidget(node) {
  return !!node.closest('.elementor-widget-text-editor, .elementor-widget-heading');
}

function findImage(element, document) {
  // 1. <img> candidates that are not part of the text widgets
  const candidates = [...element.querySelectorAll('img')].filter((img) => !isInTextWidget(img)
    && (img.getAttribute('src') || '').trim());
  if (candidates.length) {
    const desktop = candidates.find((img) => !isMobileImg(img)) || candidates[0];
    return desktop;
  }
  // 2. CSS background on the banner container, then on nested containers
  const containers = [element, ...element.querySelectorAll('.e-con, .elementor-element')]
    .filter((c) => !c.classList.contains('elementor-widget'));
  for (const c of containers) {
    const src = backgroundUrl(c, document);
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      return img;
    }
  }
  return null;
}

// Mobile-only photo: an <img> flagged as mobile, else a max-width media-query background.
function findMobileImage(element, document, desktop) {
  const imgs = [...element.querySelectorAll('img')].filter((img) => !isInTextWidget(img)
    && img !== desktop && isMobileImg(img) && (img.getAttribute('src') || '').trim());
  if (imgs.length) return imgs[0].getAttribute('src');
  const containers = [element, ...element.querySelectorAll('.e-con, .elementor-element')]
    .filter((c) => !c.classList.contains('elementor-widget'));
  for (const c of containers) {
    const src = stylesheetBackground(c, document, true);
    if (src) return src;
  }
  return null;
}

export default function parse(element, { document }) {
  // Row 1: background image; Row 2: optional mobile image
  let imageCell = '';
  let mobileCell = '';
  const img = findImage(element, document);
  const mobileSrc = findMobileImage(element, document, img);
  if (mobileSrc && mobileSrc !== (img && img.getAttribute('src'))) {
    const mob = document.createElement('img');
    mob.src = mobileSrc;
    mob.alt = '';
    mobileCell = document.createDocumentFragment();
    mobileCell.appendChild(document.createComment(' field:mobileImage '));
    mobileCell.appendChild(mob);
  }
  if (img) {
    const pic = img.closest('picture');
    const out = document.createElement('img');
    out.src = img.getAttribute('src');
    out.alt = img.getAttribute('alt') || '';
    imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(out);
    if (pic) pic.remove(); else img.remove();
  }

  // Row 2: text - H1 and optional subtitle(s), in document order
  const textNodes = [];
  element.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-heading').forEach((widget) => {
    const container = widget.querySelector('.elementor-widget-container') || widget;
    const blocks = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
      .filter((b) => !b.parentElement.closest('h1, h2, h3, h4, h5, h6, p'));
    if (blocks.length) {
      blocks.forEach((b) => { if (b.textContent.trim()) textNodes.push(b); });
    } else if (container.textContent.trim()) {
      const p = document.createElement('p');
      p.innerHTML = container.innerHTML.trim();
      textNodes.push(p);
    }
  });
  // Fallback: no widgets matched - take headings/paragraphs directly
  if (!textNodes.length) {
    element.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((b) => {
      if (!b.parentElement.closest('h1, h2, h3, h4, h5, h6, p') && b.textContent.trim()) textNodes.push(b);
    });
  }

  let textCell = '';
  if (textNodes.length) {
    textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textCell.appendChild(n));
  }

  const cells = [
    [imageCell],
    [mobileCell],
    [textCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
