// desktop layout starts where the source site switches from its mobile header
const isDesktop = window.matchMedia('(width >= 1000px)');

// accordion expand/collapse timing on mobile (matches source)
const ACCORDION_MS = 300;

const ICON_HAMBURGER = '<svg viewBox="0 0 18 14" width="30" height="30" aria-hidden="true"><rect y="0" width="18" height="1.7" rx="1"/><rect y="6.15" width="18" height="1.7" rx="1"/><rect y="12.3" width="18" height="1.7" rx="1"/></svg>';
const ICON_CLOSE = '<svg viewBox="0 0 15 15" width="12" height="12" aria-hidden="true"><path d="M1 15a1 1 0 01-.71-.29 1 1 0 010-1.41l5.8-5.8-5.8-5.8A1 1 0 011.7.29l5.8 5.8 5.8-5.8a1 1 0 011.41 1.41l-5.8 5.8 5.8 5.8a1 1 0 01-1.41 1.41l-5.8-5.8-5.8 5.8A1 1 0 011 15z"/></svg>';

/**
 * Loads the nav fragment. Metadata-independent: /content first (local preview),
 * then the site root (DA/EDS).
 * @returns {Promise<Element|null>} wrapper containing the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  // resolve relative image paths against the fragment location
  const base = new URL(resp.url);
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
  });
  return wrapper;
}

/**
 * Animates a mobile accordion panel open or closed (no-op on desktop).
 */
function animatePanel(panel, open) {
  if (isDesktop.matches || !panel.animate) return;
  const height = panel.scrollHeight;
  panel.animate(
    open ? [{ height: '0px' }, { height: `${height}px` }] : [{ height: `${height}px` }, { height: '0px' }],
    { duration: ACCORDION_MS, easing: 'ease-out' },
  );
}

function setOpen(li, open) {
  const panel = li.querySelector(':scope > .nav-dropdown');
  if (!open && panel && !isDesktop.matches) {
    // keep the panel visible until the collapse finishes
    li.classList.add('is-closing');
    animatePanel(panel, false);
    setTimeout(() => li.classList.remove('is-closing'), ACCORDION_MS);
  }
  li.classList.toggle('is-open', open);
  const trigger = li.querySelector(':scope > .nav-drop-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open && panel) animatePanel(panel, true);
}

function closeAllDropdowns(nav, except = null) {
  nav.querySelectorAll('.nav-submenu.is-open').forEach((li) => {
    if (li !== except) setOpen(li, false);
  });
}

function toggleDropdown(nav, li) {
  const open = !li.classList.contains('is-open');
  closeAllDropdowns(nav, li);
  setOpen(li, open);
}

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? forceExpanded : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  const button = nav.querySelector('.nav-hamburger button');
  if (button) {
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    button.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  }
  document.body.classList.toggle('nav-menu-open', expanded && !isDesktop.matches);
  if (!expanded) {
    nav.querySelectorAll('.nav-submenu.is-open').forEach((li) => {
      li.classList.remove('is-open');
      const trigger = li.querySelector(':scope > .nav-drop-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }
}

/**
 * Turns a fragment list into the nav menu: list items holding a label paragraph
 * and a nested list become click-to-open dropdowns (accordions on mobile).
 * @param {Element} list top-level list from the fragment
 */
function buildMenu(nav, list) {
  list.querySelectorAll(':scope > li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    // authored content may wrap a plain menu link in a paragraph
    const wrapped = li.querySelector(':scope > p > a');
    if (!sub && wrapped) wrapped.parentElement.replaceWith(wrapped);
    const link = li.querySelector(':scope > a');
    if (sub) {
      const label = li.querySelector(':scope > p');
      const trigger = document.createElement('a');
      trigger.href = '#';
      trigger.className = 'nav-trigger nav-drop-trigger';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = `<span class="nav-label">${(label ? label.textContent : '').trim()}</span><span class="nav-chevron" aria-hidden="true"></span>`;
      if (label) label.remove();
      li.prepend(trigger);
      li.classList.add('nav-submenu');
      sub.classList.add('nav-dropdown');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDropdown(nav, li);
      });
    } else if (link) {
      link.classList.add('nav-trigger', 'nav-link');
      link.innerHTML = `<span class="nav-label">${link.innerHTML}</span>`;
    }
  });
}

function buildHamburger(nav) {
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">${ICON_HAMBURGER}</button>`;
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));
  return hamburger;
}

/**
 * Mobile drawer: a full-screen layer holding a sliding panel. On desktop both
 * wrappers are layout pass-throughs, so the menu sits in the main bar.
 */
function buildDrawer(nav, brandLink, drawerLogo, navSections, tools) {
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  const panel = document.createElement('div');
  panel.className = 'nav-drawer-panel';

  const head = document.createElement('div');
  head.className = 'nav-drawer-head';
  if (brandLink && drawerLogo) {
    const link = document.createElement('a');
    link.href = brandLink.href;
    link.className = 'nav-drawer-logo';
    link.append(drawerLogo);
    head.append(link);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-drawer-close';
  close.setAttribute('aria-label', 'Close navigation');
  close.innerHTML = ICON_CLOSE;
  const closeDrawer = () => {
    toggleMenu(nav, false);
    nav.querySelector('.nav-hamburger button').focus();
  };
  close.addEventListener('click', closeDrawer);
  head.append(close);

  panel.append(head, navSections, tools);
  drawer.append(panel);
  // clicking the area outside the panel closes the drawer
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) closeDrawer();
  });
  return drawer;
}

/**
 * Header over a hero: transparent until the main bar sticks to the top.
 */
function setupSticky(block, nav) {
  const topBar = nav.querySelector('.nav-top');
  const update = () => {
    const threshold = topBar && topBar.offsetHeight ? topBar.offsetHeight : 0;
    block.classList.toggle('is-sticky', window.scrollY > threshold);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const [topSection, brandSection, menuSection, toolsSection] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // top bar: first image is the wide variant, second the compact one
  const top = document.createElement('div');
  top.className = 'nav-top';
  const topInner = document.createElement('div');
  topInner.className = 'nav-top-inner';
  if (topSection) {
    topSection.querySelectorAll('img').forEach((img, i) => {
      img.closest('p').classList.add(i === 0 ? 'nav-top-wide' : 'nav-top-compact');
    });
    topInner.append(...topSection.childNodes);
  }
  top.append(topInner);

  // main bar
  const main = document.createElement('div');
  main.className = 'nav-main';
  const mainInner = document.createElement('div');
  mainInner.className = 'nav-main-inner';

  // brand: default logo, logo on solid backgrounds, logo inside the drawer
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  let brandLink = null;
  let drawerLogo = null;
  if (brandSection) {
    // logos may sit inside the link or in their own paragraphs next to it
    brandLink = brandSection.querySelector('a');
    const logos = [...brandSection.querySelectorAll('img')];
    // three logos: over-hero, solid bar, drawer. Two logos: solid bar and drawer;
    // the over-hero logo is then the solid-bar logo rendered in white.
    let defaultLogo;
    let stickyLogo;
    let menuLogo;
    if (logos.length >= 3) {
      [defaultLogo, stickyLogo, menuLogo] = logos;
    } else {
      [stickyLogo, menuLogo] = logos;
      if (stickyLogo) {
        defaultLogo = stickyLogo.cloneNode();
        defaultLogo.classList.add('nav-logo-inverted');
      }
    }
    if (brandLink) {
      const label = brandLink.textContent.trim();
      if (label) brandLink.setAttribute('aria-label', label);
      [...brandLink.childNodes].forEach((n) => { if (!n.querySelector || !n.querySelector('img')) n.remove(); });
      [defaultLogo, stickyLogo].forEach((img, i) => {
        if (!img) return;
        img.classList.add(i === 0 ? 'nav-logo-default' : 'nav-logo-sticky');
        img.width = 140;
        img.height = 50;
        img.loading = 'eager';
        brandLink.append(img);
      });
      brand.append(brandLink);
    }
    drawerLogo = menuLogo || null;
  }

  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  const menuList = menuSection && menuSection.querySelector('ul');
  if (menuList) {
    buildMenu(nav, menuList);
    // the closing menu item is styled as the call to action
    const items = menuList.querySelectorAll(':scope > li');
    if (items.length) items[items.length - 1].classList.add('nav-cta');
    menuList.classList.add('nav-list');
    navSections.append(menuList);
  }

  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const langList = toolsSection && toolsSection.querySelector('ul');
  if (langList) {
    langList.classList.add('nav-languages');
    langList.querySelectorAll(':scope > li').forEach((li) => {
      if (!li.querySelector('a')) li.classList.add('is-active');
    });
    tools.append(langList);
  }

  const drawer = buildDrawer(nav, brandLink, drawerLogo, navSections, tools);
  mainInner.append(brand, drawer, buildHamburger(nav));
  main.append(mainInner);
  nav.append(top, main);

  // close dropdowns on outside click / Escape
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeAllDropdowns(nav);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const open = nav.querySelector('.nav-submenu.is-open');
    if (open && isDesktop.matches) {
      closeAllDropdowns(nav);
      open.querySelector('.nav-drop-trigger').focus();
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      nav.querySelector('.nav-hamburger button').focus();
    }
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // transparent overlay only when the page starts with a hero
  const firstBlock = document.querySelector('main .section:first-child [class*="hero"]');
  block.closest('header').classList.toggle('header-overlay', !!firstBlock);
  setupSticky(block.closest('header'), nav);
}
