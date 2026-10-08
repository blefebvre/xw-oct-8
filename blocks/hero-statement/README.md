# hero-statement

Custom **hero** block. Purpose: Dark full-bleed band with a background video (link in the text) and a large centered statement paragraph.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1 = optional background image (UE fields image + imageAlt), used as fallback; row 2 = rich text (UE field text) with the statement paragraph and a paragraph containing a link to the background video (Vimeo, YouTube or .mp4). The link is removed from view and replaced by a muted, autoplaying, looping background video.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.

## Notes

Background video: Vimeo links are embedded with background=1 (muted, autoplay, loop, no controls); YouTube and .mp4/.webm links are also supported. Users with prefers-reduced-motion see only the image. The iframe is lazy-loaded. Both `vimeo.com/<id>/<hash>` and `player.vimeo.com/video/<id>?h=<hash>` links are supported. The decorative diagonal stripes in the bottom-right corner come from the block CSS (`stripes.png`, and `stripes-small.png` below 768px), not from authored content.
