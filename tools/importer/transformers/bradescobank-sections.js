/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for bradescobank.com.
 *
 * beforeTransform: inserts <hr> section breaks before every non-first section
 * while the original section elements still exist. Styled sections get a
 * temporary data-excat-section-id marker on their <hr>.
 *
 * afterTransform: appends Section Metadata for styled sections. Several block
 * selectors equal their section selector (cards-segment, cards-product,
 * hero-promo), so a section element may have been replaced by a parser; in
 * that case the <hr> marker is used as the anchor.
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector, try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const doc = element.ownerDocument || (payload && payload.document);

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 1; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el) continue;
      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      if (section.style) {
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        const el = findSectionElement(element, section);
        if (el) {
          el.after(meta);
        } else if (marker) {
          // Section element replaced by a block parser: place metadata at the
          // end of the section, i.e. just before the next <hr> or at the end
          // of the marker's parent.
          let node = marker.nextElementSibling;
          let last = marker;
          while (node && node.tagName !== 'HR') {
            last = node;
            node = node.nextElementSibling;
          }
          last.after(meta);
        }
      }
      if (marker) marker.removeAttribute(MARKER);
    }
  }
}
