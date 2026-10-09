/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for bradescobank.com (WordPress / Blocksy / Elementor).
 * Selectors taken from migration-work/cleaned.html and
 * authoring-analysis.json excludedContent.
 */

// Chrome and blockers removed before parsers run (affect block matching)
const BEFORE_SELECTORS = [
  // Cookie consent banner
  '#cookie-notice',
  '.cookie-notice-container',
  // Off-canvas mobile drawer
  '#offcanvas',
  '.ct-drawer-canvas',
  // accessiBe widget and screen-reader helpers
  '.acsb-trigger',
  '.acsb-widget',
  '.acsb-sr-only',
  '.acsb-sr-alert',
  // Skip link
  'a.skip-link',
  // Elementor device-mode probe
  '#elementor-device-mode',
  // Red divider bars (spacers)
  '.elementor-element-df3b3d3',
  '.elementor-element-1191c87',
  // Mobile-only duplicate hero
  '.elementor-element-b9a3d24',
  // Hidden "digital solutions" group (hidden at all breakpoints)
  '.elementor-element-6e9c8f1',
  '.elementor-element-2f7416d',
];

// Non-authorable chrome removed after parsers ran
const AFTER_SELECTORS = [
  'header#header',
  '.ct-header',
  'footer.elementor-location-footer',
  'nav#header-menu-1',
  'nav.mobile-menu',
  '.otgs-development-site-front-end',
  'script',
  'style',
  'noscript',
  'link',
];

const TRACKING_ATTRS = [
  'data-elementor-device-mode',
  'data-header',
  'data-footer',
  'data-prefix',
  'data-link',
  'onclick',
];

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    WebImporter.DOMUtils.remove(element, BEFORE_SELECTORS);
    // Elementor containers hidden at desktop and laptop widths are either never visible or
    // mobile/tablet duplicates of desktop content; the desktop version is the one authored
    WebImporter.DOMUtils.remove(element, ['.elementor-hidden-desktop.elementor-hidden-laptop']);
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, AFTER_SELECTORS);

    element.querySelectorAll('*').forEach((el) => {
      TRACKING_ATTRS.forEach((attr) => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
    });
  }
}
