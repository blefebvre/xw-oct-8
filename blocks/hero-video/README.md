# hero-video

Custom **hero** block. Purpose: Full-bleed banner with a muted, autoplaying, looping background video (Vimeo/YouTube/MP4 link in the text) behind a right-aligned headline.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1 = optional background image (UE fields image + imageAlt), used as poster/fallback; row 2 = rich text (UE field text) with the H1 and a paragraph containing a link to the background video (Vimeo, YouTube or .mp4). The link is removed from view and replaced by a muted, autoplaying, looping background video.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.

## Notes

Background video: Vimeo links are embedded with background=1 (muted, autoplay, loop, no controls); YouTube and .mp4/.webm links are also supported. Users with prefers-reduced-motion see only the image. Loaded eagerly (above the fold).
