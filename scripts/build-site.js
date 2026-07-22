#!/usr/bin/env node

/**
 * build-site.js
 *
 * Reads every JSON file from data/events/, sorts them newest-first,
 * and generates docs/index.html with the event data embedded as a
 * JSON blob. Also copies referenced images into docs/images/.
 *
 * Usage:  node scripts/build-site.js
 * No external dependencies required.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'data', 'events');
const IMAGES_DIR = path.join(ROOT, 'images');
const DOCS_DIR = path.join(ROOT, 'docs');
const DOCS_IMAGES_DIR = path.join(DOCS_DIR, 'images');

// ---------------------------------------------------------------------------
// 1. Read and parse all event JSON files
// ---------------------------------------------------------------------------

const eventFiles = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json'));

if (eventFiles.length === 0) {
  console.warn('No event files found in data/events/ - generating empty archive.');
}

const events = eventFiles.map(file => {
  const raw = fs.readFileSync(path.join(EVENTS_DIR, file), 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${file}: ${e.message}`);
    process.exit(1);
  }
});

// Sort newest-first
events.sort((a, b) => b.date.localeCompare(a.date));

console.log(`Loaded ${events.length} event(s)`);

// ---------------------------------------------------------------------------
// 2. Copy referenced images into docs/images/
// ---------------------------------------------------------------------------

// Ensure output dirs exist
fs.mkdirSync(DOCS_IMAGES_DIR, { recursive: true });

let imagesCopied = 0;
for (const event of events) {
  if (!event.images || event.images.length === 0) continue;

  for (const img of event.images) {
    const src = path.join(IMAGES_DIR, img);
    const dest = path.join(DOCS_IMAGES_DIR, img);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      imagesCopied++;
    } else {
      console.warn(`Image not found: images/${img}`);
    }
  }
}

console.log(`Copied ${imagesCopied} image(s) to docs/images/`);

// ---------------------------------------------------------------------------
// 3. Generate docs/index.html
// ---------------------------------------------------------------------------

const html = buildHTML(events);
fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), html, 'utf-8');
fs.writeFileSync(path.join(DOCS_DIR, '.nojekyll'), '', 'utf-8');
console.log(`Generated docs/index.html`);

// ---------------------------------------------------------------------------
// HTML Template
// ---------------------------------------------------------------------------

function buildHTML(events) {
  const eventsJSON = JSON.stringify(events);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TWLD - The World's Largest Democracy</title>
  <meta name="description" content="Community archive documenting India's youth-led protest movement. A chronological record of events, verified by contributors.">
  <meta property="og:title" content="TWLD - The World's Largest Democracy">
  <meta property="og:description" content="Community archive documenting India's youth-led protest movement.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>\${getCSS()}</style>
</head>
<body>

  <header class="masthead" id="site-header">
    <div class="masthead-inner">
      <div class="masthead-brand">
        <h1 class="masthead-title">TWLD</h1>
        <p class="masthead-sub">The World's Largest Democracy / Community Protest Archive</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked="true"
        aria-label="Toggle content warnings"
        class="cw-toggle active"
        id="cw-checkbox"
      >Content warnings ON</button>
    </div>
  </header>

  <nav class="filter-nav" id="tag-filter-bar" aria-label="Filter entries by tag">
    <div class="filter-nav-inner">
      <button class="filter-link active" data-tag="all" id="tag-all">All</button>
    </div>
  </nav>

  <main class="archive" id="timeline-container">
    <div class="archive-entries" id="timeline-events"></div>
  </main>

  <div class="empty-state hidden" id="empty-state">
    <p class="empty-text">No entries match this filter.</p>
    <button class="empty-reset" id="empty-reset">Show all</button>
  </div>

  <div class="lightbox-overlay hidden" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
    <button class="lightbox-close" id="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Previous image">&#8249;</button>
    <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Next image">&#8250;</button>
    <img class="lightbox-img" id="lightbox-img" src="" alt="">
    <div class="lightbox-counter" id="lightbox-counter"></div>
  </div>

  <footer class="colophon" id="site-footer">
    <p>TWLD is an open-source, community-maintained archive.</p>
    <p class="colophon-links">
      <a href="https://github.com/spydersyrup/TWLD">Contribute on GitHub</a>
      <span class="sep">/</span>
      <a href="contributing.md">How to submit</a>
    </p>
  </footer>

  <noscript>
    <div style="padding:3rem;text-align:center;font-family:Inter,sans-serif;">
      <h2>JavaScript Required</h2>
      <p>This archive requires JavaScript to render entries. Please enable JavaScript and reload.</p>
    </div>
  </noscript>

  <script>
    window.__EVENTS__ = \${eventsJSON};
    \${getJS()}
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
function getCSS() {
  return `
:root {
  --bg:             #f2ece0;
  --bg-warm:        #eae3d5;
  --text:           #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-muted:     #8a8278;
  --accent:         #bf1a1a;
  --rule:           #cec7b5;
  --rule-heavy:     #1a1a1a;
  --cw-bg:          #1a1a1a;
  --cw-text:        #f2ece0;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.65;
  min-height: 100vh;
}

/* Masthead */

.masthead {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 2px solid var(--rule-heavy);
}

.masthead-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.1rem 1.5rem;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.masthead-title {
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text);
  line-height: 1;
}

.masthead-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.2rem;
}

.cw-toggle {
  font-family: 'Inter', sans-serif;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.35rem 0.7rem;
  background: none;
  border: 1.5px solid var(--text);
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
  line-height: 1.3;
}

.cw-toggle.active {
  background: var(--text);
  color: var(--bg);
}

.cw-toggle:hover { opacity: 0.7; }

/* Filter Nav */

.filter-nav {
  position: sticky;
  top: 63px;
  z-index: 90;
  background: var(--bg);
  border-bottom: 1px solid var(--rule);
}

.filter-nav-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 0.55rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex-wrap: wrap;
}

.filter-link {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.15rem 0.1rem;
  border-bottom: 1.5px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.filter-link:hover { color: var(--text); }

.filter-link.active {
  color: var(--text);
  font-weight: 600;
  border-bottom-color: var(--accent);
}

.filter-sep {
  color: var(--rule);
  font-size: 0.78rem;
  margin: 0 0.35rem;
  user-select: none;
}

/* Archive */

.archive {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
}

.archive-entries {
  display: flex;
  flex-direction: column;
}

/* Entry */

.entry {
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--rule);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.entry.visible { opacity: 1; }

.entry:last-child { border-bottom: none; }

.entry-date {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 0.15rem;
}

.entry-location {
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: 0.82rem;
  font-style: italic;
  color: var(--text-secondary);
  margin-bottom: 0.65rem;
}

.entry-title {
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.entry-body {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.72;
  margin-bottom: 0.9rem;
}

.entry-tags {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.verified-stamp {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  border: 1.5px solid var(--accent);
  padding: 0.1rem 0.4rem;
  line-height: 1.4;
}

/* Image Gallery */

.entry-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.4rem;
  margin-bottom: 0.9rem;
}

.gallery-thumb {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--rule);
  transition: border-color 0.15s ease;
}

.gallery-thumb:hover { border-color: var(--text); }

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Content Warning Bar */

.cw-bar {
  background: var(--cw-bg);
  padding: 1rem 1.25rem;
  margin: 0.35rem 0;
}

.cw-bar.hidden { display: none; }

.entry-content.hidden { display: none; }

.cw-bar-inner {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.cw-label {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--cw-text);
  flex-shrink: 0;
}

.cw-desc {
  font-size: 0.78rem;
  color: #aaa;
  flex: 1;
  min-width: 150px;
}

.cw-reveal {
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--cw-text);
  background: none;
  border: 1px solid #555;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
  flex-shrink: 0;
}

.cw-reveal:hover { border-color: var(--cw-text); }

/* Lightbox */

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
}

.lightbox-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 2rem;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
}

.lightbox-close:hover { color: #fff; }

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2.5rem;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

.lightbox-nav:hover { color: #fff; }

.lightbox-prev { left: 1rem; }
.lightbox-next { right: 1rem; }

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  user-select: none;
}

.lightbox-counter {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.78rem;
  color: #666;
  font-family: 'Inter', sans-serif;
}

/* Empty State */

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  max-width: 720px;
  margin: 0 auto;
}

.empty-state.hidden { display: none; }

.empty-text {
  font-family: 'Libre Baskerville', Georgia, serif;
  font-style: italic;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.empty-reset {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text);
  background: none;
  border: 1px solid var(--text);
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.empty-reset:hover {
  background: var(--text);
  color: var(--bg);
}

/* Footer */

.colophon {
  border-top: 1px solid var(--rule);
  padding: 1.5rem;
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.colophon-links { margin-top: 0.3rem; }

.colophon-links a {
  color: var(--text-secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.colophon-links a:hover { color: var(--text); }

.sep { margin: 0 0.3rem; }

/* Responsive */

@media (max-width: 640px) {
  .masthead-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .filter-nav { top: 100px; }

  .entry-title { font-size: 1.12rem; }

  .cw-bar-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .lightbox-nav { font-size: 2rem; }
  .lightbox-prev { left: 0.25rem; }
  .lightbox-next { right: 0.25rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
  }
  .entry { opacity: 1; }
}
`;
}

// ---------------------------------------------------------------------------
// JavaScript
// ---------------------------------------------------------------------------
function getJS() {
  return `
(function () {
  'use strict';

  var events = window.__EVENTS__ || [];
  var cwEnabled = true;
  var revealedCards = new Set();
  var activeTagFilter = 'all';

  var timelineEl      = document.getElementById('timeline-events');
  var tagBarInner     = document.querySelector('.filter-nav-inner');
  var cwToggle        = document.getElementById('cw-checkbox');
  var emptyState      = document.getElementById('empty-state');
  var emptyReset      = document.getElementById('empty-reset');
  var lightbox        = document.getElementById('lightbox');
  var lightboxImg     = document.getElementById('lightbox-img');
  var lightboxCounter = document.getElementById('lightbox-counter');
  var lightboxClose   = document.getElementById('lightbox-close');
  var lightboxPrev    = document.getElementById('lightbox-prev');
  var lightboxNext    = document.getElementById('lightbox-next');

  var lbImages = [];
  var lbIndex  = 0;

  // Build tag set and render filter links
  var allTags = new Set();
  events.forEach(function (ev) {
    (ev.tags || []).forEach(function (t) { allTags.add(t); });
  });

  Array.from(allTags).sort().forEach(function (tag) {
    var sep = document.createElement('span');
    sep.className = 'filter-sep';
    sep.textContent = '/';
    tagBarInner.appendChild(sep);

    var btn = document.createElement('button');
    btn.className = 'filter-link';
    btn.setAttribute('data-tag', tag);
    btn.id = 'tag-' + tag;
    btn.textContent = tag;
    btn.addEventListener('click', function () { filterByTag(tag); });
    tagBarInner.appendChild(btn);
  });

  document.getElementById('tag-all').addEventListener('click', function () {
    filterByTag('all');
  });

  // Render entries
  function renderTimeline() {
    timelineEl.innerHTML = '';
    var visibleCount = 0;

    events.forEach(function (ev) {
      if (activeTagFilter !== 'all') {
        if (!ev.tags || ev.tags.indexOf(activeTagFilter) === -1) return;
      }
      visibleCount++;

      var card = document.createElement('article');
      card.className = 'entry';
      card.setAttribute('data-id', ev.id);
      card.setAttribute('data-graphic', ev.graphic_content ? 'true' : 'false');
      card.id = 'event-' + ev.id;

      var dateObj = new Date(ev.date + 'T00:00:00Z');
      var dateStr = dateObj.toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'UTC'
      });

      var isHidden = ev.graphic_content && cwEnabled && !revealedCards.has(ev.id);
      var html = '';

      // Date and location (always visible)
      html += '<time class="entry-date">' + escHtml(dateStr) + '</time>';
      html += '<div class="entry-location">' + escHtml(ev.location) + '</div>';

      // Content warning bar for graphic entries
      if (ev.graphic_content) {
        html += '<div class="cw-bar' + (isHidden ? '' : ' hidden') + '" data-cw-for="' + escAttr(ev.id) + '">';
        html += '<div class="cw-bar-inner">';
        html += '<span class="cw-label">Content Warning</span>';
        html += '<span class="cw-desc">This entry documents graphic content depicting violence or injury.</span>';
        html += '<button class="cw-reveal" data-reveal="' + escAttr(ev.id) + '">Reveal</button>';
        html += '</div></div>';
      }

      // Entry content (hidden when CW is active for graphic entries)
      html += '<div class="entry-content' + (isHidden ? ' hidden' : '') + '">';

      html += '<h2 class="entry-title">' + escHtml(ev.title) + '</h2>';
      html += '<p class="entry-body">' + escHtml(ev.description) + '</p>';

      // Image gallery
      if (ev.images && ev.images.length) {
        html += '<div class="entry-gallery">';
        ev.images.forEach(function (img, imgIdx) {
          var src = 'images/' + img;
          html += '<div class="gallery-thumb" data-event-id="' + escAttr(ev.id) + '" data-img-index="' + imgIdx + '">';
          html += '<img src="' + escAttr(src) + '" alt="Photo from ' + escAttr(ev.title) + '" loading="lazy">';
          html += '</div>';
        });
        html += '</div>';
      }

      // Tags as slash-separated text
      if (ev.tags && ev.tags.length) {
        html += '<div class="entry-tags">' + ev.tags.map(escHtml).join(' / ') + '</div>';
      }

      // Meta line
      html += '<div class="entry-meta">';
      if (ev.verified) {
        html += '<span class="verified-stamp">Verified</span>';
      }
      html += '<span>Contributed by ' + escHtml(ev.contributor) + '</span>';
      html += '</div>';

      html += '</div>'; // close .entry-content

      card.innerHTML = html;
      timelineEl.appendChild(card);
    });

    if (visibleCount === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }

    observeCards();
    bindGalleryClicks();
    bindCWReveals();
  }

  // Tag filtering
  function filterByTag(tag) {
    activeTagFilter = tag;
    var links = document.querySelectorAll('.filter-link');
    links.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-tag') === tag);
    });
    renderTimeline();
  }

  emptyReset.addEventListener('click', function () {
    filterByTag('all');
  });

  // Content warning toggle
  cwToggle.addEventListener('click', function () {
    cwEnabled = !cwEnabled;
    cwToggle.classList.toggle('active', cwEnabled);
    cwToggle.setAttribute('aria-checked', cwEnabled ? 'true' : 'false');
    cwToggle.textContent = cwEnabled ? 'Content warnings ON' : 'Content warnings OFF';
    updateCWOverlays();
  });

  function updateCWOverlays() {
    document.querySelectorAll('.cw-bar').forEach(function (bar) {
      var evId = bar.getAttribute('data-cw-for');
      if (!cwEnabled || revealedCards.has(evId)) {
        bar.classList.add('hidden');
      } else {
        bar.classList.remove('hidden');
      }
    });
    document.querySelectorAll('.entry-content').forEach(function (content) {
      var card = content.closest('.entry');
      if (!card || card.getAttribute('data-graphic') !== 'true') return;
      var evId = card.getAttribute('data-id');
      if (!cwEnabled || revealedCards.has(evId)) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });
  }

  function bindCWReveals() {
    document.querySelectorAll('.cw-reveal').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var evId = btn.getAttribute('data-reveal');
        revealedCards.add(evId);
        updateCWOverlays();
      });
    });
  }

  // Scroll-triggered fade-in
  function observeCards() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.entry').forEach(function (c) {
        c.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll('.entry:not(.visible)').forEach(function (c) {
      observer.observe(c);
    });
  }

  // Gallery / Lightbox
  function bindGalleryClicks() {
    document.querySelectorAll('.gallery-thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var evId = thumb.getAttribute('data-event-id');
        var imgIdx = parseInt(thumb.getAttribute('data-img-index'), 10);
        var ev = events.find(function (e) { return e.id === evId; });
        if (!ev || !ev.images) return;
        lbImages = ev.images.map(function (img) { return 'images/' + img; });
        lbIndex = imgIdx;
        openLightbox();
      });
    });
  }

  function openLightbox() {
    if (!lbImages.length) return;
    lightbox.classList.remove('hidden');
    showLightboxImage();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function showLightboxImage() {
    lightboxImg.src = lbImages[lbIndex];
    lightboxImg.alt = 'Image ' + (lbIndex + 1) + ' of ' + lbImages.length;
    lightboxCounter.textContent = (lbIndex + 1) + ' / ' + lbImages.length;
    lightboxPrev.style.display = lbImages.length > 1 ? '' : 'none';
    lightboxNext.style.display = lbImages.length > 1 ? '' : 'none';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  lightboxPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
    showLightboxImage();
  });

  lightboxNext.addEventListener('click', function (e) {
    e.stopPropagation();
    lbIndex = (lbIndex + 1) % lbImages.length;
    showLightboxImage();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
      showLightboxImage();
    }
    if (e.key === 'ArrowRight') {
      lbIndex = (lbIndex + 1) % lbImages.length;
      showLightboxImage();
    }
  });

  var touchStartX = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; }
      else { lbIndex = (lbIndex + 1) % lbImages.length; }
      showLightboxImage();
    }
  }, { passive: true });

  // Helpers
  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function escAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  renderTimeline();
})();
`;
}
