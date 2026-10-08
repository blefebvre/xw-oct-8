/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-video (bradescobank.com home hero).
 * Source: .elementor-element-b079a4a > .e-con-inner
 *   - .elementor-background-video-container iframe[src*="vimeo"]  (background video, no poster)
 *   - h1 headline inside the boxed child container
 * Output (xwalk model hero-video): row 1 = image (empty, no poster), row 2 = text (richtext)
 * with the H1 and a paragraph linking to the Vimeo video (consumed by hero-video.js).
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
  // Elementor stores the link in data-settings on the container (live DOM)
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

  // Row 2: text (richtext) - headline + video link
  const textCell = document.createDocumentFragment();
  const heading = element.querySelector('h1, h2');
  const textNodes = [];
  if (heading) textNodes.push(heading);
  if (videoUrl) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = videoUrl;
    a.textContent = videoUrl;
    p.appendChild(a);
    textNodes.push(p);
  }
  if (textNodes.length) {
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textCell.appendChild(n));
  }

  const cells = [
    [imageCell],
    [textNodes.length ? textCell : ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
