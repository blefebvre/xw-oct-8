/* eslint-disable */
/* global WebImporter */

/**
 * Link transformer for bradescobank.com: links to pages that have been migrated
 * become site-relative; links to anything else keep pointing at the original site.
 * Runs after parsers so links inside blocks are covered too.
 *
 * Add a path to MIGRATED_PAGES whenever a page is migrated, then re-import the
 * pages that link to it.
 */
const MIGRATED_PAGES = [
  '/',
  '/en/bank-holidays',
  '/en/cra-public-file',
  '/en/help',
  '/en/other-disclosures',
  '/en/security',
];

const SOURCE_HOSTS = ['bradescobank.com', 'www.bradescobank.com'];
const LOCALES = ['en', 'pt', 'es'];

// Path of the source page on the new site, following the source's own redirects:
// locale-less paths live under /en, and /en/ is the homepage. Null for non-pages.
function toSitePath(url) {
  if (!SOURCE_HOSTS.includes(url.hostname)) return null;
  let path = url.pathname.replace(/\/+$/, '') || '/';
  if (/^\/(wp-content|wp-admin|wp-json|assets)\//.test(path) || /\.[a-z0-9]{2,5}$/i.test(path)) return null;
  if (path !== '/' && !LOCALES.includes(path.split('/')[1])) path = `/en${path}`;
  return path === '/en' ? '/' : path;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  element.querySelectorAll('a[href]').forEach((a) => {
    let url;
    try { url = new URL(a.getAttribute('href'), 'https://bradescobank.com/'); } catch (e) { return; }
    const path = toSitePath(url);
    if (path && MIGRATED_PAGES.includes(path)) a.setAttribute('href', `${path}${url.hash}`);
  });
}
