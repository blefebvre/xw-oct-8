/* eslint-disable */
/* global WebImporter */

// Parsers
import heroVideoParser from './parsers/hero-video.js';
import cardsSegmentParser from './parsers/cards-segment.js';
import heroStatementParser from './parsers/hero-statement.js';
import cardsProductParser from './parsers/cards-product.js';
import heroPromoParser from './parsers/hero-promo.js';

// Transformers
import cleanupTransformer from './transformers/bradescobank-cleanup.js';
import sectionsTransformer from './transformers/bradescobank-sections.js';

const PAGE_TEMPLATE = {
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

const parsers = {
  'hero-video': heroVideoParser,
  'cards-segment': cardsSegmentParser,
  'hero-statement': heroStatementParser,
  'cards-product': cardsProductParser,
  'hero-promo': heroPromoParser,
};

const transformers = [cleanupTransformer, sectionsTransformer];

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
