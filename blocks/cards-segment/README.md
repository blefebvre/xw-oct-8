# cards-segment

Custom **cards** block. Purpose: Edge-to-edge row of tall portrait photo tiles, each fully linked, with an uppercase label at the bottom.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: cell 1 = portrait image (UE fields image + imageAlt); cell 2 = rich text (UE field text) with one link whose text is the tile label. The whole tile becomes clickable.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
