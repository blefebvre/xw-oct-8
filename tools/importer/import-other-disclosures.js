/* eslint-disable */
/* global WebImporter */

// Parsers
import heroBannerParser from './parsers/hero-banner.js';
import cardsDownloadParser from './parsers/cards-download.js';

// Transformers
import bradescobankCleanupTransformer from './transformers/bradescobank-cleanup.js';
import bradescobankSectionsTransformer from './transformers/bradescobank-sections.js';
import bradescobankLinksTransformer from './transformers/bradescobank-links.js';

const PAGE_TEMPLATE = {
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

const parsers = {
  'hero-banner': heroBannerParser,
  'cards-download': cardsDownloadParser,
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
