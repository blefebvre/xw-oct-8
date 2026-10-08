import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDEO_LINK = /(vimeo\.com|youtube\.com|youtu\.be)\/|\.(mp4|webm)(\?|#|$)/i;

function findVideoLink(block) {
  return [...block.querySelectorAll('a[href]')].find((a) => VIDEO_LINK.test(a.href));
}

function vimeoSrc(url) {
  const id = url.pathname.split('/').filter((s) => /^\d+$/.test(s)).pop();
  if (!id) return null;
  const params = new URLSearchParams({
    background: '1', autoplay: '1', muted: '1', loop: '1', autopause: '0', dnt: '1',
  });
  const hash = url.searchParams.get('h');
  if (hash) params.set('h', hash);
  return `https://player.vimeo.com/video/${id}?${params}`;
}

function youtubeSrc(url) {
  const id = url.hostname.includes('youtu.be')
    ? url.pathname.split('/').filter(Boolean)[0]
    : url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: '1', mute: '1', loop: '1', playlist: id, controls: '0', playsinline: '1', rel: '0',
  });
  return `https://www.youtube.com/embed/${id}?${params}`;
}

function buildBackgroundVideo(href, eager) {
  const url = new URL(href, window.location.href);
  if (/\.(mp4|webm)$/i.test(url.pathname)) {
    const video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    const source = document.createElement('source');
    source.src = url.href;
    source.type = `video/${url.pathname.split('.').pop().toLowerCase()}`;
    video.append(source);
    return video;
  }
  const src = url.hostname.includes('vimeo') ? vimeoSrc(url) : youtubeSrc(url);
  if (!src) return null;
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = 'Background video';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.loading = eager ? 'eager' : 'lazy';
  return iframe;
}

export default function decorate(block) {
  const rows = [...block.children];
  // the content row is the last row carrying text; the media row is the (possibly empty) image row
  const contentRow = rows.filter((row) => row.textContent.trim()).pop();
  let mediaRow = rows.find((row) => row !== contentRow);

  if (!mediaRow) {
    mediaRow = document.createElement('div');
    block.prepend(mediaRow);
  }
  mediaRow.className = 'hero-video-media';
  if (contentRow) contentRow.className = 'hero-video-content';

  mediaRow.querySelectorAll('picture > img').forEach((img) => {
    const pic = createOptimizedPicture(img.src, img.alt, true, [{ width: '2000' }]);
    moveInstrumentation(img, pic.querySelector('img'));
    img.closest('picture').replaceWith(pic);
  });

  const link = findVideoLink(block);
  if (!link) return;
  const { href } = link;
  const holder = link.closest('p') || link;
  link.remove();
  if (holder !== link && !holder.textContent.trim() && !holder.children.length) holder.remove();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const media = buildBackgroundVideo(href, true);
  if (!media) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'hero-video-background';
  wrapper.append(media);
  mediaRow.append(wrapper);
  block.classList.add('has-video');
}
