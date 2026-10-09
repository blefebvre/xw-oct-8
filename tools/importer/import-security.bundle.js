/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-security.js
  var import_security_exports = {};
  __export(import_security_exports, {
    default: () => import_security_default
  });

  // tools/importer/parsers/hero-banner.js
  var MOBILE_RE = /(^|[-_./\s])(mob|mobile|mobi|phone|sm|xs)([-_./\s0-9]|$)/i;
  function pickUrl(bg) {
    if (!bg || bg === "none") return null;
    const m = bg.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
    return m ? m[1] : null;
  }
  function stylesheetBackground(el, document, mobile = false) {
    const idClass = [...el.classList].find((c) => /^elementor-element-[0-9a-f]{6,}$/.test(c));
    if (!idClass || !document.styleSheets) return null;
    const re = new RegExp(`\\.${idClass}(?![\\w-])`);
    const isMobileMedia = (text) => {
      const m = /max-width:\s*(\d+)px/.exec(text || "");
      return !!m && +m[1] <= 767 && !/min-width/.test(text);
    };
    let found = null;
    const visit = (rules, media) => {
      for (const rule of [...rules]) {
        if (found) return;
        if (rule.cssRules && rule.media) {
          visit(rule.cssRules, rule.media.mediaText);
          continue;
        }
        if (!rule.selectorText || !rule.style) continue;
        if (mobile ? !isMobileMedia(media) : media) continue;
        const first = rule.selectorText.split(",")[0];
        if (re.test(first) && !/::?(before|after)/.test(first)) {
          const url = pickUrl(rule.style.backgroundImage || rule.style.background);
          if (url) found = url;
        }
      }
    };
    for (const sheet of [...document.styleSheets]) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch (e) {
        continue;
      }
      if (rules) visit(rules, "");
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
    const dataSettings = el.getAttribute && el.getAttribute("data-settings");
    if (dataSettings) {
      try {
        const s = JSON.parse(dataSettings);
        const slide = s && s.background_slideshow_gallery && s.background_slideshow_gallery[0];
        if (slide && slide.url) return slide.url;
      } catch (e) {
      }
    }
    if (document.defaultView && document.defaultView.getComputedStyle) {
      try {
        return pickUrl(document.defaultView.getComputedStyle(el).backgroundImage);
      } catch (e) {
      }
    }
    return null;
  }
  function isMobileImg(img) {
    const cls = `${img.className || ""} ${(img.closest("[class]") || {}).className || ""}`;
    if (/elementor-hidden-desktop/.test(cls)) return true;
    const src = img.getAttribute("src") || "";
    const file = src.split("?")[0].split("/").pop() || "";
    return MOBILE_RE.test(file);
  }
  function isInTextWidget(node) {
    return !!node.closest(".elementor-widget-text-editor, .elementor-widget-heading");
  }
  function findImage(element, document) {
    const candidates = [...element.querySelectorAll("img")].filter((img) => !isInTextWidget(img) && (img.getAttribute("src") || "").trim());
    if (candidates.length) {
      const desktop = candidates.find((img) => !isMobileImg(img)) || candidates[0];
      return desktop;
    }
    const containers = [element, ...element.querySelectorAll(".e-con, .elementor-element")].filter((c) => !c.classList.contains("elementor-widget"));
    for (const c of containers) {
      const src = backgroundUrl(c, document);
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        return img;
      }
    }
    return null;
  }
  function findMobileImage(element, document, desktop) {
    const imgs = [...element.querySelectorAll("img")].filter((img) => !isInTextWidget(img) && img !== desktop && isMobileImg(img) && (img.getAttribute("src") || "").trim());
    if (imgs.length) return imgs[0].getAttribute("src");
    const containers = [element, ...element.querySelectorAll(".e-con, .elementor-element")].filter((c) => !c.classList.contains("elementor-widget"));
    for (const c of containers) {
      const src = stylesheetBackground(c, document, true);
      if (src) return src;
    }
    return null;
  }
  function parse(element, { document }) {
    let imageCell = "";
    let mobileCell = "";
    const img = findImage(element, document);
    const mobileSrc = findMobileImage(element, document, img);
    if (mobileSrc && mobileSrc !== (img && img.getAttribute("src"))) {
      const mob = document.createElement("img");
      mob.src = mobileSrc;
      mob.alt = "";
      mobileCell = document.createDocumentFragment();
      mobileCell.appendChild(document.createComment(" field:mobileImage "));
      mobileCell.appendChild(mob);
    }
    if (img) {
      const pic = img.closest("picture");
      const out = document.createElement("img");
      out.src = img.getAttribute("src");
      out.alt = img.getAttribute("alt") || "";
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(out);
      if (pic) pic.remove();
      else img.remove();
    }
    const textNodes = [];
    element.querySelectorAll(".elementor-widget-text-editor, .elementor-widget-heading").forEach((widget) => {
      const container = widget.querySelector(".elementor-widget-container") || widget;
      const blocks = [...container.querySelectorAll("h1, h2, h3, h4, h5, h6, p")].filter((b) => !b.parentElement.closest("h1, h2, h3, h4, h5, h6, p"));
      if (blocks.length) {
        blocks.forEach((b) => {
          if (b.textContent.trim()) textNodes.push(b);
        });
      } else if (container.textContent.trim()) {
        const p = document.createElement("p");
        p.innerHTML = container.innerHTML.trim();
        textNodes.push(p);
      }
    });
    if (!textNodes.length) {
      element.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach((b) => {
        if (!b.parentElement.closest("h1, h2, h3, h4, h5, h6, p") && b.textContent.trim()) textNodes.push(b);
      });
    }
    let textCell = "";
    if (textNodes.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textCell.appendChild(n));
    }
    const cells = [
      [imageCell],
      [mobileCell],
      [textCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-note.js
  function clean(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absoluteUrl(href) {
    if (!href) return "";
    if (/^(mailto|tel|data):/i.test(href) || href.startsWith("#")) return href;
    if (href.startsWith("//")) return `https:${href}`;
    if (/^https?:/i.test(href)) return href;
    if (href.startsWith("./") || href.startsWith("../")) return href;
    try {
      return new URL(href, "https://bradescobank.com/").href;
    } catch (e) {
      return href;
    }
  }
  function isHidden(el) {
    return !!(el.closest && el.closest(".elementor-hidden-desktop"));
  }
  function widgetContent(widget, document) {
    const container = widget.querySelector(":scope > .elementor-widget-container") || widget;
    const out = [];
    let para = null;
    const flush = () => {
      if (para && clean(para.textContent)) out.push(para);
      para = null;
    };
    [...container.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (!clean(node.textContent)) return;
        if (!para) para = document.createElement("p");
        para.appendChild(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
        return;
      }
      if (node.nodeType !== 1) return;
      if (/^(P|UL|OL|H[1-6]|BLOCKQUOTE)$/.test(node.tagName)) {
        flush();
        if (!clean(node.textContent)) return;
        node.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", absoluteUrl(a.getAttribute("href"))));
        out.push(node);
        return;
      }
      if (!para) para = document.createElement("p");
      para.appendChild(node);
    });
    flush();
    return out;
  }
  function parse2(element, { document }) {
    const cards = [...element.querySelectorAll(".protect-account")].filter((c) => !isHidden(c));
    const cells = [];
    cards.forEach((card) => {
      const own = (w) => w.closest(".protect-account") === card && !isHidden(w);
      const srcImg = [...card.querySelectorAll(".elementor-widget-image img")].find(own);
      const texts = [...card.querySelectorAll(".elementor-widget-text-editor, .elementor-widget-heading")].filter(own).flatMap((w) => widgetContent(w, document));
      if (!srcImg && !texts.length) return;
      const imageCell = document.createElement("div");
      if (srcImg && srcImg.getAttribute("src")) {
        const img = document.createElement("img");
        img.src = absoluteUrl(srcImg.getAttribute("src"));
        img.alt = clean(srcImg.getAttribute("alt"));
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document.createElement("div");
      if (texts.length) {
        textCell.appendChild(document.createComment(" field:text "));
        texts.forEach((n) => textCell.appendChild(n));
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-note", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-tips.js
  var ICON_BASE = "https://bradescobank.com/wp-content/uploads/2024/06/";
  var FALLBACK_ICONS = {
    "yourself-protect": {
      1: `${ICON_BASE}icon-security-1-e1717622897112.png`,
      2: `${ICON_BASE}icon-security-2-e1717622309241.png`,
      3: `${ICON_BASE}icon-security-3-e1717622015213.png`,
      4: `${ICON_BASE}icon-security-4-e1717622080513.png`
    }
  };
  function clean2(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absoluteUrl2(href) {
    if (!href) return "";
    if (/^(mailto|tel|data):/i.test(href) || href.startsWith("#")) return href;
    if (href.startsWith("//")) return `https:${href}`;
    if (/^https?:/i.test(href)) return href;
    if (href.startsWith("./") || href.startsWith("../")) return href;
    try {
      return new URL(href, "https://bradescobank.com/").href;
    } catch (e) {
      return href;
    }
  }
  function pickUrl2(value) {
    if (!value || value === "none") return null;
    const m = value.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
    return m ? m[1] : null;
  }
  function collectRules(document) {
    const out = [];
    const walk = (rules) => {
      [...rules || []].forEach((rule) => {
        if (rule.selectorText && rule.style) out.push(rule);
        else if (rule.cssRules) walk(rule.cssRules);
      });
    };
    [...document.styleSheets || []].forEach((sheet) => {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch (e) {
        return;
      }
      walk(rules);
    });
    return out;
  }
  function iconsFromStylesheets(element, document) {
    const scopes = [...element.classList].filter((c) => c === "yourself-protect" || /^elementor-element-[0-9a-f]{6,}$/.test(c) || !c.startsWith("elementor")).map((c) => new RegExp(`\\.${c.replace(/[-]/g, "\\-")}(?![\\w-])`));
    if (!scopes.length) return {};
    const icons = {};
    collectRules(document).forEach((rule) => {
      rule.selectorText.split(",").forEach((sel) => {
        if (!/::?(before|after)/.test(sel)) return;
        const tab = sel.match(/\[data-tab=["']?(\d+)["']?\]/);
        if (!tab || !scopes.some((re) => re.test(sel))) return;
        const url = pickUrl2(rule.style.backgroundImage || rule.style.background) || pickUrl2(rule.style.content);
        if (url) icons[tab[1]] = url;
      });
    });
    return icons;
  }
  function fallbackIcons(element) {
    const key = Object.keys(FALLBACK_ICONS).find((c) => element.classList.contains(c));
    return key ? FALLBACK_ICONS[key] : {};
  }
  function parse3(element, { document }) {
    const icons = __spreadValues(__spreadValues({}, fallbackIcons(element)), iconsFromStylesheets(element, document));
    const items = [...element.querySelectorAll(".elementor-accordion-item")];
    const cells = [];
    items.forEach((item, index) => {
      const titleEl = item.querySelector(".elementor-tab-title");
      const label = clean2((item.querySelector(".elementor-accordion-title") || titleEl || {}).textContent);
      const content = item.querySelector(".elementor-tab-content");
      if (!label && !(content && clean2(content.textContent))) return;
      const summaryCell = document.createElement("div");
      if (label) {
        summaryCell.appendChild(document.createComment(" field:summary "));
        summaryCell.appendChild(document.createTextNode(label));
      }
      const textCell = document.createElement("div");
      if (content && clean2(content.textContent)) {
        textCell.appendChild(document.createComment(" field:text "));
        content.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", absoluteUrl2(a.getAttribute("href"))));
        [...content.childNodes].forEach((n) => {
          if (n.nodeType === 3 && !clean2(n.textContent)) return;
          if (n.nodeType === 3) {
            const p = document.createElement("p");
            p.textContent = clean2(n.textContent);
            textCell.appendChild(p);
          } else if (n.nodeType === 1) {
            textCell.appendChild(n);
          }
        });
      }
      const tab = titleEl && titleEl.getAttribute("data-tab") || String(index + 1);
      const iconCell = document.createElement("div");
      const iconUrl = icons[tab];
      if (iconUrl) {
        const img = document.createElement("img");
        img.src = absoluteUrl2(iconUrl);
        img.alt = "";
        iconCell.appendChild(document.createComment(" field:image "));
        iconCell.appendChild(img);
      }
      cells.push([summaryCell, textCell, iconCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-tips", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-image-bleed.js
  function clean3(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absoluteUrl3(href) {
    if (!href) return "";
    if (/^(mailto|tel|data):/i.test(href) || href.startsWith("#")) return href;
    if (href.startsWith("//")) return `https:${href}`;
    if (/^https?:/i.test(href)) return href;
    if (href.startsWith("./") || href.startsWith("../")) return href;
    try {
      return new URL(href, "https://bradescobank.com/").href;
    } catch (e) {
      return href;
    }
  }
  function pickUrl3(bg) {
    if (!bg || bg === "none") return null;
    const m = bg.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
    return m ? m[1] : null;
  }
  function backgroundUrl2(el, document) {
    const idClass = [...el.classList].find((c) => /^elementor-element-[0-9a-f]{6,}$/.test(c));
    if (idClass && document.styleSheets) {
      const re = new RegExp(`\\.${idClass}(?![\\w-])`);
      for (const sheet of [...document.styleSheets]) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch (e) {
          continue;
        }
        for (const rule of [...rules || []]) {
          if (!rule.selectorText || !rule.style) continue;
          const first = rule.selectorText.split(",")[0];
          if (re.test(first) && !/::?(before|after)/.test(first)) {
            const url = pickUrl3(rule.style.backgroundImage || rule.style.background);
            if (url) return url;
          }
        }
      }
    }
    const inline = pickUrl3(el.style && (el.style.backgroundImage || el.style.background));
    if (inline) return inline;
    if (document.defaultView && document.defaultView.getComputedStyle) {
      try {
        return pickUrl3(document.defaultView.getComputedStyle(el).backgroundImage);
      } catch (e) {
      }
    }
    return null;
  }
  function isHidden2(el) {
    return !!(el.closest && el.closest(".elementor-hidden-desktop"));
  }
  function parse4(element, { document }) {
    const children = [...element.children].filter((c) => c.matches(".e-con") && !isHidden2(c));
    const photoWrap = element.querySelector(".elementor-element-98d6419") || children.find((c) => !c.querySelector(".elementor-widget-text-editor, .elementor-widget-heading")) || null;
    const textWrap = element.querySelector(".elementor-element-a35c121") || children.find((c) => c !== photoWrap) || null;
    let photo = null;
    if (photoWrap) {
      const src = photoWrap.querySelector("img");
      const url = src && src.getAttribute("src") || backgroundUrl2(photoWrap, document);
      if (url) {
        photo = document.createElement("img");
        photo.src = absoluteUrl3(url);
        photo.alt = clean3(src && src.getAttribute("alt"));
      }
    }
    const textCell = [];
    if (textWrap) {
      const widgets = [...textWrap.querySelectorAll(".elementor-widget-text-editor, .elementor-widget-heading")].filter((w) => !isHidden2(w));
      widgets.forEach((w, wi) => {
        const container = w.querySelector(":scope > .elementor-widget-container") || w;
        const blocks = [...container.children].filter((n) => clean3(n.textContent));
        if (wi === 0) {
          const lead = clean3(container.textContent);
          if (lead) {
            const p = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = lead;
            p.appendChild(strong);
            textCell.push(p);
          }
          return;
        }
        if (!blocks.length && clean3(container.textContent)) {
          const p = document.createElement("p");
          p.textContent = clean3(container.textContent);
          textCell.push(p);
          return;
        }
        blocks.forEach((n) => {
          n.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", absoluteUrl3(a.getAttribute("href"))));
          textCell.push(n);
        });
      });
    }
    const cells = [[photo || "", textCell.length ? textCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-image-bleed", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/bradescobank-cleanup.js
  var BEFORE_SELECTORS = [
    // Cookie consent banner
    "#cookie-notice",
    ".cookie-notice-container",
    // Off-canvas mobile drawer
    "#offcanvas",
    ".ct-drawer-canvas",
    // accessiBe widget and screen-reader helpers
    ".acsb-trigger",
    ".acsb-widget",
    ".acsb-sr-only",
    ".acsb-sr-alert",
    // Skip link
    "a.skip-link",
    // Elementor device-mode probe
    "#elementor-device-mode",
    // Red divider bars (spacers)
    ".elementor-element-df3b3d3",
    ".elementor-element-1191c87",
    // Mobile-only duplicate hero
    ".elementor-element-b9a3d24",
    // Hidden "digital solutions" group (hidden at all breakpoints)
    ".elementor-element-6e9c8f1",
    ".elementor-element-2f7416d"
  ];
  var AFTER_SELECTORS = [
    "header#header",
    ".ct-header",
    "footer.elementor-location-footer",
    "nav#header-menu-1",
    "nav.mobile-menu",
    ".otgs-development-site-front-end",
    "script",
    "style",
    "noscript",
    "link"
  ];
  var TRACKING_ATTRS = [
    "data-elementor-device-mode",
    "data-header",
    "data-footer",
    "data-prefix",
    "data-link",
    "onclick"
  ];
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, BEFORE_SELECTORS);
      WebImporter.DOMUtils.remove(element, [".elementor-hidden-desktop.elementor-hidden-laptop"]);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, AFTER_SELECTORS);
      element.querySelectorAll("*").forEach((el) => {
        TRACKING_ATTRS.forEach((attr) => {
          if (el.hasAttribute(attr)) el.removeAttribute(attr);
        });
      });
    }
  }

  // tools/importer/transformers/bradescobank-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument || payload && payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 1; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(element, section);
        if (!el) continue;
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (section.style) {
          const meta = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          const el = findSectionElement(element, section);
          if (el) {
            el.after(meta);
          } else if (marker) {
            let node = marker.nextElementSibling;
            let last = marker;
            while (node && node.tagName !== "HR") {
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

  // tools/importer/transformers/bradescobank-links.js
  var MIGRATED_PAGES = [
    "/",
    "/en/bank-holidays",
    "/en/cra-public-file",
    "/en/help",
    "/en/other-disclosures",
    "/en/security"
  ];
  var SOURCE_HOSTS = ["bradescobank.com", "www.bradescobank.com"];
  var LOCALES = ["en", "pt", "es"];
  function toSitePath(url) {
    if (!SOURCE_HOSTS.includes(url.hostname)) return null;
    let path = url.pathname.replace(/\/+$/, "") || "/";
    if (/^\/(wp-content|wp-admin|wp-json|assets)\//.test(path) || /\.[a-z0-9]{2,5}$/i.test(path)) return null;
    if (path !== "/" && !LOCALES.includes(path.split("/")[1])) path = `/en${path}`;
    return path === "/en" ? "/" : path;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    element.querySelectorAll("a[href]").forEach((a) => {
      let url;
      try {
        url = new URL(a.getAttribute("href"), "https://bradescobank.com/");
      } catch (e) {
        return;
      }
      const path = toSitePath(url);
      if (path && MIGRATED_PAGES.includes(path)) a.setAttribute("href", `${path}${url.hash}`);
    });
  }

  // tools/importer/import-security.js
  var PAGE_TEMPLATE = {
    "name": "security",
    "urls": [
      "https://bradescobank.com/en/security/"
    ],
    "representativeUrl": "https://bradescobank.com/en/security/",
    "description": "Photo banner, intro columns, accordion of security tips, icon list",
    "blocks": [
      {
        "name": "hero-banner",
        "instances": [
          ".elementor-element-8ea493e"
        ]
      },
      {
        "name": "cards-note",
        "instances": [
          ".elementor-element-a2edf52",
          ".elementor-element-ebf86a1",
          ".elementor-element-ba0258e"
        ]
      },
      {
        "name": "accordion-tips",
        "instances": [
          ".elementor-element-349fe54"
        ]
      },
      {
        "name": "columns-image-bleed",
        "instances": [
          ".elementor-element-5358476"
        ]
      }
    ],
    "sections": [
      {
        "defaultContent": [],
        "id": "s1",
        "name": "Page title banner",
        "selector": [
          ".elementor-element-8ea493e"
        ],
        "style": null,
        "blocks": [
          "hero-banner"
        ]
      },
      {
        "defaultContent": [
          ".elementor-element-f3490dc h2"
        ],
        "id": "s2",
        "name": "Protection heading",
        "selector": [
          ".elementor-element-985c385"
        ],
        "style": "centered",
        "blocks": []
      },
      {
        "defaultContent": [],
        "id": "s3",
        "name": "Protection note cards",
        "selector": [
          ".elementor-element-a2edf52"
        ],
        "style": null,
        "blocks": [
          "cards-note"
        ]
      },
      {
        "defaultContent": [
          ".elementor-element-ee12537 h2"
        ],
        "id": "s4",
        "name": "Protect yourself tips",
        "selector": [
          ".elementor-element-14b83e7"
        ],
        "style": "light-grey, centered",
        "blocks": [
          "accordion-tips"
        ]
      },
      {
        "defaultContent": [
          ".elementor-element-6576b90 h2"
        ],
        "id": "s5",
        "name": "Security tips heading",
        "selector": [
          ".elementor-element-60799a5"
        ],
        "style": "centered",
        "blocks": []
      },
      {
        "defaultContent": [],
        "id": "s6",
        "name": "Avoid fraud",
        "selector": [
          ".elementor-element-5358476"
        ],
        "style": null,
        "blocks": [
          "columns-image-bleed"
        ]
      },
      {
        "defaultContent": [],
        "id": "s7",
        "name": "Fraud note cards",
        "selector": [
          ".elementor-element-ba0258e"
        ],
        "style": null,
        "blocks": [
          "cards-note"
        ]
      }
    ]
  };
  var parsers = {
    "hero-banner": parse,
    "cards-note": parse2,
    "accordion-tips": parse3,
    "columns-image-bleed": parse4
  };
  var transformers = [transform, transform2, transform3];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          if (pageBlocks.some((b) => b.element === element)) return;
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_security_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_security_exports);
})();
