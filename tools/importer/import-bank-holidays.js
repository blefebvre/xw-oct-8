/* eslint-disable */
/* global WebImporter */

// Parsers
import heroBannerParser from './parsers/hero-banner.js';
import columnsCardListParser from './parsers/columns-card-list.js';

// Transformers
import bradescobankCleanupTransformer from './transformers/bradescobank-cleanup.js';
import bradescobankSectionsTransformer from './transformers/bradescobank-sections.js';
import bradescobankLinksTransformer from './transformers/bradescobank-links.js';

const PAGE_TEMPLATE = {
  "name": "bank-holidays",
  "urls": [
    "https://bradescobank.com/en/bank-holidays/"
  ],
  "representativeUrl": "https://bradescobank.com/en/bank-holidays/",
  "description": "Photo banner with title, then a centered card with a two-column holiday list",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".elementor-element-1c4cdd8"
      ]
    },
    {
      "name": "columns-card-list",
      "instances": [
        ".elementor-element-7f5d2f5"
      ]
    }
  ],
  "sections": [
    {
      "defaultContent": [],
      "id": "s1",
      "name": "Page title banner",
      "selector": [
        ".elementor-element-1c4cdd8"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ]
    },
    {
      "defaultContent": [
        ".elementor-element-4264604 h2",
        ".elementor-element-4468544 p"
      ],
      "id": "s2",
      "name": "Holiday calendar (heading, card, footnote)",
      "selector": [
        ".elementor-element-ba583de"
      ],
      "style": "light-grey",
      "blocks": [
        "columns-card-list"
      ]
    }
  ]
};

const parsers = {
  'hero-banner': heroBannerParser,
  'columns-card-list': columnsCardListParser,
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
