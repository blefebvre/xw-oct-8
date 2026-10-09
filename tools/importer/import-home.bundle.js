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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-video.js
  function cleanVideoUrl(raw) {
    if (!raw) return null;
    try {
      const url = new URL(raw, "https://bradescobank.com");
      if (/vimeo\.com$/i.test(url.hostname)) {
        const id = url.pathname.split("/").filter((s) => /^\d+$/.test(s)).pop();
        if (!id) return url.href;
        const hash = url.searchParams.get("h");
        return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ""}`;
      }
      return url.href;
    } catch (e) {
      return raw;
    }
  }
  function findVideoUrl(element) {
    const iframe = element.querySelector('.elementor-background-video-container iframe[src], iframe[src*="vimeo"], iframe[src*="youtube"]');
    if (iframe) return cleanVideoUrl(iframe.getAttribute("src"));
    const video = element.querySelector(".elementor-background-video-container video[src], video source[src]");
    if (video) return cleanVideoUrl(video.getAttribute("src"));
    const holder = element.closest("[data-settings]") || element.querySelector("[data-settings]");
    if (holder) {
      try {
        const settings = JSON.parse(holder.getAttribute("data-settings"));
        if (settings && settings.background_video_link) return cleanVideoUrl(settings.background_video_link);
      } catch (e) {
      }
    }
    return null;
  }
  function parse(element, { document }) {
    const videoUrl = findVideoUrl(element);
    const imageCell = "";
    const textCell = document.createDocumentFragment();
    const heading = element.querySelector("h1, h2");
    const textNodes = [];
    if (heading) textNodes.push(heading);
    if (videoUrl) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = videoUrl;
      a.textContent = videoUrl;
      p.appendChild(a);
      textNodes.push(p);
    }
    if (textNodes.length) {
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textCell.appendChild(n));
    }
    const cells = [
      [imageCell],
      [textNodes.length ? textCell : ""]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-segment.js
  var TILE_IMAGES = {
    private_bank: "https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-2.jpg",
    personal_bank: "https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-1.jpg",
    us_residents: "https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-4.jpg",
    business: "https://bradescobank.com/wp-content/uploads/2024/05/desk-thumb-discovery-3.jpg"
  };
  var TILE_IMAGES_BY_INDEX = Object.values(TILE_IMAGES);
  function backgroundUrl(el, document) {
    const pick = (bg2) => {
      const m = bg2 && bg2.match(/url\(["']?([^"')]+)["']?\)/);
      return m ? m[1] : null;
    };
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
        if (!rules) continue;
        for (const rule of [...rules]) {
          if (!rule.selectorText || !rule.style) continue;
          const first = rule.selectorText.split(",")[0];
          if (re.test(first) && !/::?(before|after)/.test(first)) {
            const url = pick(rule.style.backgroundImage);
            if (url) return url;
          }
        }
      }
    }
    let bg = el.style && el.style.backgroundImage;
    if ((!bg || bg === "none") && document.defaultView && document.defaultView.getComputedStyle) {
      try {
        bg = document.defaultView.getComputedStyle(el).backgroundImage;
      } catch (e) {
        bg = "";
      }
    }
    return pick(bg);
  }
  function parse2(element, { document }) {
    const cells = [];
    let tiles = [...element.querySelectorAll(":scope > a")];
    if (!tiles.length) tiles = [...element.children].filter((c) => c.querySelector(".title-services"));
    tiles.forEach((tile, index) => {
      const labelEl = tile.querySelector(".title-services p, .title-services .elementor-widget-container, p");
      const label = labelEl ? labelEl.textContent.trim() : tile.textContent.trim();
      if (!label) return;
      let imageCell = "";
      const srcImg = tile.querySelector("img");
      const imgSrc = srcImg ? srcImg.getAttribute("src") : backgroundUrl(tile, document) || TILE_IMAGES[tile.id] || TILE_IMAGES_BY_INDEX[index];
      if (imgSrc) {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = srcImg && srcImg.getAttribute("alt") || label;
        imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      const p = document.createElement("p");
      const href = tile.getAttribute("href") || tile.querySelector("a[href]") && tile.querySelector("a[href]").getAttribute("href");
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        p.appendChild(a);
      } else {
        p.textContent = label;
      }
      textCell.appendChild(p);
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-segment", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-statement.js
  function cleanVideoUrl2(raw) {
    if (!raw) return null;
    try {
      const url = new URL(raw, "https://bradescobank.com");
      if (/vimeo\.com$/i.test(url.hostname)) {
        const id = url.pathname.split("/").filter((s) => /^\d+$/.test(s)).pop();
        if (!id) return url.href;
        const hash = url.searchParams.get("h");
        return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ""}`;
      }
      return url.href;
    } catch (e) {
      return raw;
    }
  }
  function findVideoUrl2(element) {
    const iframe = element.querySelector('.elementor-background-video-container iframe[src], iframe[src*="vimeo"], iframe[src*="youtube"]');
    if (iframe) return cleanVideoUrl2(iframe.getAttribute("src"));
    const video = element.querySelector(".elementor-background-video-container video[src], video source[src]");
    if (video) return cleanVideoUrl2(video.getAttribute("src"));
    const holder = element.closest("[data-settings]") || element.querySelector("[data-settings]");
    if (holder) {
      try {
        const settings = JSON.parse(holder.getAttribute("data-settings"));
        if (settings && settings.background_video_link) return cleanVideoUrl2(settings.background_video_link);
      } catch (e) {
      }
    }
    return null;
  }
  function parse3(element, { document }) {
    const videoUrl = findVideoUrl2(element);
    const imageCell = "";
    const textNodes = [];
    element.querySelectorAll(".elementor-widget-text-editor .elementor-widget-container").forEach((container) => {
      const blocks = [...container.querySelectorAll(":scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4")];
      if (blocks.length) {
        blocks.forEach((b) => {
          if (b.textContent.trim()) textNodes.push(b);
        });
      } else if (container.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = container.textContent.trim();
        textNodes.push(p);
      }
    });
    if (videoUrl) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = videoUrl;
      a.textContent = videoUrl;
      p.appendChild(a);
      textNodes.push(p);
    }
    let textCell = "";
    if (textNodes.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textCell.appendChild(n));
    }
    const cells = [
      [imageCell],
      [textCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-statement", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  function widgetContent(widget, document) {
    const nodes = [];
    const container = widget.querySelector(".elementor-widget-container") || widget;
    if (widget.classList.contains("elementor-widget-image")) {
      const img = container.querySelector("img");
      if (img) {
        const p = document.createElement("p");
        p.appendChild(img);
        nodes.push(p);
      }
      return nodes;
    }
    const blocks = [...container.children].filter((c) => /^(P|H[1-6]|UL|OL)$/.test(c.tagName));
    if (blocks.length) {
      blocks.forEach((b) => {
        if (b.textContent.trim() || b.querySelector("img")) nodes.push(b);
      });
    } else if (container.textContent.trim()) {
      const p = document.createElement("p");
      p.innerHTML = container.innerHTML.trim();
      nodes.push(p);
    }
    return nodes;
  }
  function backgroundUrl2(el, document) {
    const pick = (bg2) => {
      const m = bg2 && bg2.match(/url\(["']?([^"')]+)["']?\)/);
      return m ? m[1] : null;
    };
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
        if (!rules) continue;
        for (const rule of [...rules]) {
          if (!rule.selectorText || !rule.style) continue;
          const first = rule.selectorText.split(",")[0];
          if (re.test(first) && !/::?(before|after)/.test(first)) {
            const url = pick(rule.style.backgroundImage);
            if (url) return url;
          }
        }
      }
    }
    let bg = el.style && el.style.backgroundImage;
    if ((!bg || bg === "none") && document.defaultView && document.defaultView.getComputedStyle) {
      try {
        bg = document.defaultView.getComputedStyle(el).backgroundImage;
      } catch (e) {
        bg = "";
      }
    }
    return pick(bg);
  }
  function parse4(element, { document }) {
    const cells = [];
    const cards = [...element.querySelectorAll(":scope > .e-con")];
    cards.forEach((card) => {
      let imageCell = "";
      let img = card.querySelector(":scope > img") || card.querySelector(":scope > picture img");
      if (!img) {
        const src = backgroundUrl2(card, document);
        if (src) {
          img = document.createElement("img");
          img.src = src;
          img.alt = "";
        }
      }
      if (img) {
        imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textNodes = [];
      const body = card.querySelector(".discovery-product");
      if (body) {
        body.querySelectorAll(".elementor-widget").forEach((widget) => {
          textNodes.push(...widgetContent(widget, document));
        });
      }
      const cta = card.querySelector(":scope > .elementor-widget-button a[href]");
      if (cta) {
        const labelEl = cta.querySelector(".elementor-button-text");
        const label = (labelEl ? labelEl.textContent : cta.textContent).trim();
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        textNodes.push(p);
      }
      card.querySelectorAll(":scope > .elementor-widget-text-editor").forEach((widget) => {
        textNodes.push(...widgetContent(widget, document));
      });
      let textCell = "";
      if (textNodes.length) {
        textCell = document.createDocumentFragment();
        textCell.appendChild(document.createComment(" field:text "));
        textNodes.forEach((n) => textCell.appendChild(n));
      }
      if (!imageCell && !textCell) return;
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-promo.js
  function backgroundUrl3(el, document) {
    const pick = (bg2) => {
      const m = bg2 && bg2.match(/url\(["']?([^"')]+)["']?\)/);
      return m ? m[1] : null;
    };
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
        if (!rules) continue;
        for (const rule of [...rules]) {
          if (!rule.selectorText || !rule.style) continue;
          const first = rule.selectorText.split(",")[0];
          if (re.test(first) && !/::?(before|after)/.test(first)) {
            const url = pick(rule.style.backgroundImage);
            if (url) return url;
          }
        }
      }
    }
    let bg = el.style && el.style.backgroundImage;
    if ((!bg || bg === "none") && document.defaultView && document.defaultView.getComputedStyle) {
      try {
        bg = document.defaultView.getComputedStyle(el).backgroundImage;
      } catch (e) {
        bg = "";
      }
    }
    return pick(bg);
  }
  function parse5(element, { document }) {
    let imageCell = "";
    let img = element.querySelector(":scope > img") || element.querySelector(":scope > picture img");
    if (!img) {
      const src = backgroundUrl3(element, document);
      if (src) {
        img = document.createElement("img");
        img.src = src;
        img.alt = "";
      }
    }
    if (img) {
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(img);
    }
    const textNodes = [];
    element.querySelectorAll(".elementor-widget-text-editor, .elementor-widget-heading, .elementor-widget-button").forEach((widget) => {
      if (widget.classList.contains("elementor-widget-button")) {
        const cta = widget.querySelector("a[href]");
        if (!cta) return;
        const labelEl = cta.querySelector(".elementor-button-text");
        const label = (labelEl ? labelEl.textContent : cta.textContent).trim();
        if (!label) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        textNodes.push(p);
        return;
      }
      const container = widget.querySelector(".elementor-widget-container") || widget;
      const blocks = [...container.children].filter((c) => /^(P|H[1-6]|UL|OL)$/.test(c.tagName));
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
    let textCell = "";
    if (textNodes.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textCell.appendChild(n));
    }
    const cells = [
      [imageCell],
      [textCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-promo", cells });
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

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
    "name": "home",
    "urls": [
      "https://bradescobank.com/"
    ],
    "representativeUrl": "https://bradescobank.com/",
    "description": "Bradesco Bank homepage: video hero, client segment tiles, statement band, product tiles and promo banner",
    "blocks": [
      {
        "name": "hero-video",
        "instances": [
          ".elementor-element-b079a4a > .e-con-inner"
        ]
      },
      {
        "name": "cards-segment",
        "instances": [
          "section.elementor-element-6ff733d",
          "section.services"
        ]
      },
      {
        "name": "hero-statement",
        "instances": [
          ".elementor-element-e5bf88e > .e-con-inner"
        ]
      },
      {
        "name": "cards-product",
        "instances": [
          ".elementor-element-c28d200",
          ".elementor-element-6cab8f9"
        ]
      },
      {
        "name": "hero-promo",
        "instances": [
          ".elementor-element-f4e421d"
        ]
      }
    ],
    "urlPattern": "/",
    "sections": [
      {
        "id": "rc3",
        "name": "Hero video banner",
        "selector": [
          ".elementor-element-b079a4a"
        ],
        "style": null,
        "blocks": [
          "hero-video"
        ],
        "defaultContent": []
      },
      {
        "id": "rc5",
        "name": "Tailored offerings intro",
        "selector": [
          ".elementor-element-c766b99"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          ".elementor-element-37e512d h2"
        ]
      },
      {
        "id": "rc6",
        "name": "Client segment tiles",
        "selector": [
          "section.elementor-element-6ff733d",
          "section.services"
        ],
        "style": null,
        "blocks": [
          "cards-segment"
        ],
        "defaultContent": []
      },
      {
        "id": "rc8",
        "name": "Solutions statement video band",
        "selector": [
          ".elementor-element-e5bf88e"
        ],
        "style": null,
        "blocks": [
          "hero-statement"
        ],
        "defaultContent": []
      },
      {
        "id": "rc9",
        "name": "Products intro",
        "selector": [
          ".elementor-element-0faff3c"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          ".elementor-element-147aee5 h2"
        ]
      },
      {
        "id": "rc10",
        "name": "Products row 1",
        "selector": [
          ".elementor-element-c28d200"
        ],
        "style": null,
        "blocks": [
          "cards-product"
        ],
        "defaultContent": []
      },
      {
        "id": "rc11",
        "name": "Products row 2",
        "selector": [
          ".elementor-element-6cab8f9"
        ],
        "style": null,
        "blocks": [
          "cards-product"
        ],
        "defaultContent": []
      },
      {
        "id": "rc12",
        "name": "Market trends intro",
        "selector": [
          ".elementor-element-3326291"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          ".elementor-element-69c93f6 h2"
        ]
      },
      {
        "id": "rc13",
        "name": "Exclusive content promo banner",
        "selector": [
          ".elementor-element-f4e421d"
        ],
        "style": null,
        "blocks": [
          "hero-promo"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "hero-video": parse,
    "cards-segment": parse2,
    "hero-statement": parse3,
    "cards-product": parse4,
    "hero-promo": parse5
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
  var import_home_default = {
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
  return __toCommonJS(import_home_exports);
})();
