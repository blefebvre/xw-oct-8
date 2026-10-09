/* eslint-disable */
/* global WebImporter */

// Parsers
import heroBannerParser from './parsers/hero-banner.js';
import columnsContactParser from './parsers/columns-contact.js';

// Transformers
import bradescobankCleanupTransformer from './transformers/bradescobank-cleanup.js';
import bradescobankSectionsTransformer from './transformers/bradescobank-sections.js';
import bradescobankLinksTransformer from './transformers/bradescobank-links.js';

const PAGE_TEMPLATE = {
  "name": "help",
  "urls": [
    "https://bradescobank.com/en/help/"
  ],
  "representativeUrl": "https://bradescobank.com/en/help/",
  "description": "Photo banner with title, then contact information sections",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".elementor-element-93efab2"
      ]
    },
    {
      "name": "columns-contact",
      "instances": [
        ".elementor-element-81ae845"
      ]
    }
  ],
  "sections": [
    {
      "defaultContent": [],
      "id": "s1",
      "name": "Page title banner",
      "selector": [
        ".elementor-element-93efab2"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ]
    },
    {
      "defaultContent": [
        ".elementor-element-36f6f2d h2"
      ],
      "id": "s2",
      "name": "Contact heading",
      "selector": [
        ".elementor-element-3012ebd"
      ],
      "style": "centered",
      "blocks": []
    },
    {
      "defaultContent": [],
      "id": "s3",
      "name": "Contact details with photo",
      "selector": [
        ".elementor-element-81ae845"
      ],
      "style": null,
      "blocks": [
        "columns-contact"
      ]
    },
    {
      "defaultContent": [
        ".elementor-element-865d32d p"
      ],
      "id": "s4",
      "name": "Address line",
      "selector": [
        ".elementor-element-58cd61f"
      ],
      "style": "centered",
      "blocks": []
    }
  ]
};

const parsers = {
  'hero-banner': heroBannerParser,
  'columns-contact': columnsContactParser,
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
