# cards-product

Custom **cards** block. Purpose: Two-up full-bleed product tiles with the image as darkened background and overlaid eyebrow, heading, copy, CTA and optional footnote.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: cell 1 = background image (UE fields image + imageAlt); cell 2 = rich text (UE field text): optional eyebrow paragraph, heading (or a logo image paragraph), description, CTA link paragraph, optional footnote paragraphs after the CTA.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
