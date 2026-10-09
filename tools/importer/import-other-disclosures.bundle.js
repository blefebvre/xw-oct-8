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

  // tools/importer/import-other-disclosures.js
  var import_other_disclosures_exports = {};
  __export(import_other_disclosures_exports, {
    default: () => import_other_disclosures_default
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

  // tools/importer/parsers/cards-download.js
  function clean(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absoluteHref(href, document) {
    if (!href) return "";
    if (/^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href)) {
      return href.startsWith("//") ? `https:${href}` : href;
    }
    try {
      return new URL(href, "https://bradescobank.com/").href;
    } catch (e) {
      return href;
    }
  }
  function titleParagraphs(widget, document) {
    const container = widget.querySelector(":scope > .elementor-widget-container") || widget;
    const sources = [...container.querySelectorAll("p, h1, h2, h3, h4, h5, h6")];
    const blocks = sources.length ? sources : [container];
    const out = [];
    blocks.forEach((src) => {
      const p = document.createElement("p");
      const lines = [];
      let current = "";
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) current += n.textContent;
          else if (n.nodeType === 1 && n.tagName === "BR") {
            lines.push(current);
            current = "";
          } else if (n.nodeType === 1) walk(n);
        });
      };
      walk(src);
      lines.push(current);
      const cleaned = lines.map(clean).filter(Boolean);
      cleaned.forEach((line, i) => {
        if (i > 0) p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode(line));
      });
      if (cleaned.length) out.push(p);
    });
    return out;
  }
  function parse2(element, { document }) {
    const widgets = [...element.querySelectorAll(".elementor-widget-text-editor, .elementor-widget-button")].filter((w) => !(w.closest && w.closest(".elementor-hidden-desktop")));
    const cells = [];
    let pendingTitle = [];
    widgets.forEach((widget) => {
      if (widget.classList.contains("elementor-widget-text-editor")) {
        pendingTitle = pendingTitle.concat(titleParagraphs(widget, document));
        return;
      }
      const link = widget.querySelector("a[href]");
      if (!link) return;
      const a = document.createElement("a");
      a.href = absoluteHref(link.getAttribute("href"), document);
      a.textContent = clean(link.textContent) || "DOWNLOAD";
      const ctaP = document.createElement("p");
      ctaP.appendChild(a);
      const textCell = document.createElement("div");
      textCell.appendChild(document.createComment(" field:text "));
      pendingTitle.forEach((p) => textCell.appendChild(p));
      textCell.appendChild(ctaP);
      cells.push([textCell]);
      pendingTitle = [];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-download", cells });
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

  // tools/importer/import-other-disclosures.js
  var PAGE_TEMPLATE = {
    "name": "other-disclosures",
    "urls": [
      "https://bradescobank.com/en/other-disclosures/"
    ],
    "representativeUrl": "https://bradescobank.com/en/other-disclosures/",
    "description": "Photo banner with title, then a grid of disclosure document cards with buttons",
    "blocks": [
      {
        "name": "hero-banner",
        "instances": [
          ".elementor-element-2530a90"
        ]
      },
      {
        "name": "cards-download",
        "instances": [
          ".elementor-element-0e286b0"
        ]
      }
    ],
    "sections": [
      {
        "defaultContent": [],
        "id": "s1",
        "name": "Page title banner",
        "selector": [
          ".elementor-element-2530a90"
        ],
        "style": null,
        "blocks": [
          "hero-banner"
        ]
      },
      {
        "defaultContent": [],
        "id": "s2",
        "name": "Disclosure documents grid",
        "selector": [
          ".elementor-element-0e286b0"
        ],
        "style": null,
        "blocks": [
          "cards-download"
        ]
      },
      {
        "defaultContent": [
          ".elementor-element-8690dff p",
          ".elementor-element-f2be000 a",
          ".elementor-element-129171b a",
          ".elementor-element-306e182 a"
        ],
        "id": "s3",
        "name": "Useful links",
        "selector": [
          ".elementor-element-d721a61"
        ],
        "style": "centered",
        "blocks": []
      }
    ]
  };
  var parsers = {
    "hero-banner": parse,
    "cards-download": parse2
  };
  var transformers = [transform, transform2];
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
  var import_other_disclosures_default = {
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
  return __toCommonJS(import_other_disclosures_exports);
})();
