/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-statement (bradescobank.com solutions statement band).
 * Source: .elementor-element-e5bf88e > .e-con-inner
 *   - .elementor-background-video-container iframe[src*="vimeo"]  (background video, no poster)
 *   - .elementor-widget-text-editor p  (statement paragraph - stays a paragraph)
 * Output (xwalk model hero-statement): row 1 = image (empty, no poster), row 2 = text (richtext)
 * with the statement paragraph and a paragraph linking to the Vimeo video (consumed by hero-statement.js).
 */

function cleanVideoUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw, 'https://bradescobank.com');
    if (/vimeo\.com$/i.test(url.hostname)) {
      const id = url.pathname.split('/').filter((s) => /^\d+$/.test(s)).pop();
      if (!id) return url.href;
      const hash = url.searchParams.get('h');
      return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`;
    }
    return url.href;
  } catch (e) {
    return raw;
  }
}

function findVideoUrl(element) {
  const iframe = element.querySelector('.elementor-background-video-container iframe[src], iframe[src*="vimeo"], iframe[src*="youtube"]');
  if (iframe) return cleanVideoUrl(iframe.getAttribute('src'));
  const video = element.querySelector('.elementor-background-video-container video[src], video source[src]');
  if (video) return cleanVideoUrl(video.getAttribute('src'));
  const holder = element.closest('[data-settings]') || element.querySelector('[data-settings]');
  if (holder) {
    try {
      const settings = JSON.parse(holder.getAttribute('data-settings'));
      if (settings && settings.background_video_link) return cleanVideoUrl(settings.background_video_link);
    } catch (e) {
      // ignore malformed settings
    }
  }
  return null;
}

export default function parse(element, { document }) {
  const videoUrl = findVideoUrl(element);

  // Row 1: background image (none on source; video only) - empty cell, no hint
  const imageCell = '';

  // Row 2: text (richtext) - statement paragraph(s) + video link
  const textNodes = [];
  element.querySelectorAll('.elementor-widget-text-editor .elementor-widget-container').forEach((container) => {
    const blocks = [...container.querySelectorAll(':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4')];
    if (blocks.length) {
      blocks.forEach((b) => { if (b.textContent.trim()) textNodes.push(b); });
    } else if (container.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = container.textContent.trim();
      textNodes.push(p);
    }
  });
  if (videoUrl) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = videoUrl;
    a.textContent = videoUrl;
    p.appendChild(a);
    textNodes.push(p);
  }

  let textCell = '';
  if (textNodes.length) {
    textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textCell.appendChild(n));
  }

  const cells = [
    [imageCell],
    [textCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-statement', cells });
  element.replaceWith(block);
}
