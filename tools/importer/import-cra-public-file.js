/* eslint-disable */
/* global WebImporter */

// Parsers
import heroBannerParser from './parsers/hero-banner.js';
import cardsIconParser from './parsers/cards-icon.js';

// Transformers
import bradescobankCleanupTransformer from './transformers/bradescobank-cleanup.js';
import bradescobankSectionsTransformer from './transformers/bradescobank-sections.js';
import bradescobankLinksTransformer from './transformers/bradescobank-links.js';

const PAGE_TEMPLATE = {
  "name": "cra-public-file",
  "urls": [
    "https://bradescobank.com/en/cra-public-file/"
  ],
  "representativeUrl": "https://bradescobank.com/en/cra-public-file/",
  "description": "Photo banner with title, intro text and a grid of document cards with buttons",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".elementor-element-2d43f3e"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        ".elementor-element-220b4b9"
      ]
    }
  ],
  "sections": [
    {
      "defaultContent": [],
      "id": "s1",
      "name": "Page title banner",
      "selector": [
        ".elementor-element-2d43f3e"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ]
    },
    {
      "defaultContent": [
        ".elementor-element-b513d82 h3"
      ],
      "id": "s2",
      "name": "Introductory statement",
      "selector": [
        ".elementor-element-518a5cc"
      ],
      "style": "centered",
      "blocks": []
    },
    {
      "defaultContent": [],
      "id": "s3",
      "name": "Document cards",
      "selector": [
        ".elementor-element-220b4b9"
      ],
      "style": null,
      "blocks": [
        "cards-icon"
      ]
    }
  ]
};

const parsers = {
  'hero-banner': heroBannerParser,
  'cards-icon': cardsIconParser,
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
