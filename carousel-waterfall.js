// Side waterfall galleries (two independent vertical columns)
// Uses images from: carousel pictures/5.jpg .. carousel pictures/38.jpg

(function () {
  const IMG_BASE = 'carousel pictures/';
  const IMG_START = 5;
  const IMG_END = 38;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getImages() {
    const images = [];
    for (let i = IMG_START; i <= IMG_END; i++) {
      images.push(`${IMG_BASE}${i}.jpg`);
    }
    return images;
  }

  function parseIntAttr(el, name, fallback) {
    const v = el.getAttribute(name);
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function createTile(src, alt, index) {
    const fig = document.createElement('figure');
    fig.className = 'wf-item';
    fig.setAttribute('data-index', String(index));

    const img = document.createElement('img');
    img.className = 'wf-img';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    img.alt = alt || '';

    fig.appendChild(img);
    return fig;
  }

  // Top-to-bottom vertical stacking with variable heights.
  // We keep the images compressed by setting fixed tile heights.
  function layoutTiles(container, tiles) {
    const base = parseIntAttr(container, 'data-base-height', 170);
    const variance = parseIntAttr(container, 'data-variance', 90);

    // Randomize vertical positions by applying small deterministic offsets.
    // This avoids the “all perfectly stacked” look.
    const seedBase = (Date.now() % 1000000) + Math.random() * 1000;

    for (let i = 0; i < tiles.length; i++) {
      // Deterministic pseudo-random height to create the waterfall look.
      const seed = (i * 9301 + 49297 + Math.floor(seedBase)) % 233280;
      const r = seed / 233280; // 0..1
      const h = clamp(base + Math.round((r - 0.5) * variance), 120, 320);
      tiles[i].style.height = h + 'px';

      // Small stagger so their top edges vary slightly
      const staggerMax = Math.min(12, Math.round(variance / 8));
      const staggerSeed = (seed * 1664525 + 1013904223) % 4294967296;
      const offset = (staggerSeed / 4294967296) * staggerMax;
      tiles[i].style.marginTop = Math.round(offset) + 'px';
    }
  }


  function buildGallery(container) {
    const images = getImages();
    if (!images.length) return;

    const count = parseIntAttr(container, 'data-count', images.length);
    const altPrefix = container.getAttribute('data-alt-prefix') || 'Carousel photo';


    // Clear
    container.innerHTML = '';

    const track = document.createElement('div');
    track.className = 'wf-track';

    const tiles = [];
    for (let i = 0; i < count; i++) {
      const src = images[i % images.length];
      tiles.push(createTile(src, `${altPrefix} ${i + 1}`, i));
    }

    // Keep columns independent (each column loops its own content).
    // We do NOT duplicate tiles, so columns are not “connected”.
    tiles.forEach((t) => track.appendChild(t));
    container.appendChild(track);

    layoutTiles(container, tiles);


    // Animation (optional): if reduced motion, stop.
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const speed = parseIntAttr(container, 'data-speed', 40); // seconds
    container.style.setProperty('--wf-duration', speed + 's');

  }

  document.addEventListener('DOMContentLoaded', () => {
    const galleries = document.querySelectorAll('[data-waterfall]');
    galleries.forEach((g) => buildGallery(g));
  });
})();

