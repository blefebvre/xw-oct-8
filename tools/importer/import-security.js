/* eslint-disable */
/* global WebImporter */

// Parsers
import heroBannerParser from './parsers/hero-banner.js';
import cardsNoteParser from './parsers/cards-note.js';
import accordionTipsParser from './parsers/accordion-tips.js';
import columnsImageBleedParser from './parsers/columns-image-bleed.js';

// Transformers
import bradescobankCleanupTransformer from './transformers/bradescobank-cleanup.js';
import bradescobankSectionsTransformer from './transformers/bradescobank-sections.js';
import bradescobankLinksTransformer from './transformers/bradescobank-links.js';

const PAGE_TEMPLATE = {
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

const parsers = {
  'hero-banner': heroBannerParser,
  'cards-note': cardsNoteParser,
  'accordion-tips': accordionTipsParser,
  'columns-image-bleed': columnsImageBleedParser,
};

const transformers = [bradescobankCleanupTransformer, bradescobankSectionsTransformer, bradescobankLinksTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); } catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
