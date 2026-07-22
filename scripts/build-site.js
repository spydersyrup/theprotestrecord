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
  console.warn('⚠  No event files found in data/events/ - generating empty timeline.');
}

const events = eventFiles.map(file => {
  const raw = fs.readFileSync(path.join(EVENTS_DIR, file), 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`✗ Failed to parse ${file}: ${e.message}`);
    process.exit(1);
  }
});

// Sort newest-first
events.sort((a, b) => b.date.localeCompare(a.date));

console.log(`✓ Loaded ${events.length} event(s)`);

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
      console.warn(`⚠  Image not found: images/${img}`);
    }
  }
}

console.log(`✓ Copied ${imagesCopied} image(s) to docs/images/`);

// ---------------------------------------------------------------------------
// 3. Generate docs/index.html
// ---------------------------------------------------------------------------

const html = buildHTML(events);
fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), html, 'utf-8');
console.log(`✓ Generated docs/index.html`);

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
  <meta name="description" content="Community archive documenting India's youth-led protest movement. A chronological timeline of events with photos, verified accounts, and contributor credits.">
  <meta property="og:title" content="TWLD - The World's Largest Democracy">
  <meta property="og:description" content="Documenting India's youth-led protest movement through verified, community-sourced accounts.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${getCSS()}</style>
</head>
<body>

  <!-- ====== HEADER ====== -->
  <header class="site-header" id="site-header">
    <div class="header-inner">
      <div class="header-brand">
        <h1 class="header-title">TWLD</h1>
        <p class="header-tagline">Community archive of India's youth-led protest movement</p>
      </div>
      <div class="header-controls">
        <div class="cw-toggle" id="cw-toggle">
          <label class="toggle-label" for="cw-checkbox">
            <span class="toggle-icon">⚠</span>
            <span class="toggle-text">Content warnings</span>
          </label>
          <button
            type="button"
            role="switch"
            aria-checked="true"
            aria-label="Toggle content warnings"
            class="toggle-switch active"
            id="cw-checkbox"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- ====== TAG FILTER BAR ====== -->
  <nav class="tag-filter-bar" id="tag-filter-bar" aria-label="Filter events by tag">
    <div class="tag-filter-inner">
      <span class="filter-label">Filter:</span>
      <button class="tag-pill active" data-tag="all" id="tag-all">All</button>
    </div>
  </nav>

  <!-- ====== TIMELINE ====== -->
  <main class="timeline-container" id="timeline-container">
    <div class="timeline-spine" aria-hidden="true"></div>
    <div class="timeline-events" id="timeline-events">
      <!-- Cards injected by JS -->
    </div>
  </main>

  <!-- ====== EMPTY STATE ====== -->
  <div class="empty-state hidden" id="empty-state">
    <p class="empty-icon">📭</p>
    <p class="empty-text">No events match this filter.</p>
    <button class="empty-reset" id="empty-reset">Show all events</button>
  </div>

  <!-- ====== LIGHTBOX ====== -->
  <div class="lightbox-overlay hidden" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
    <button class="lightbox-close" id="lightbox-close" aria-label="Close image viewer">&times;</button>
    <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Previous image">&#8249;</button>
    <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Next image">&#8250;</button>
    <img class="lightbox-img" id="lightbox-img" src="" alt="">
    <div class="lightbox-counter" id="lightbox-counter"></div>
  </div>

  <!-- ====== FOOTER ====== -->
  <footer class="site-footer" id="site-footer">
    <div class="footer-inner">
      <p>TWLD is an open-source, community-maintained archive.</p>
      <p class="footer-links">
        <a href="https://github.com/spydersyrup/TWLD" target="_blank" rel="noopener">Contribute on GitHub</a>
        <span class="footer-sep">·</span>
        <a href="contributing.md" target="_blank" rel="noopener">How to submit</a>
      </p>
    </div>
  </footer>

  <noscript>
    <div style="padding:2rem;text-align:center;color:#e8d5b7;font-family:Inter,sans-serif;">
      <h2>JavaScript Required</h2>
      <p>This timeline requires JavaScript to render event data. Please enable JavaScript and reload the page.</p>
    </div>
  </noscript>

  <script>
    window.__EVENTS__ = ${eventsJSON};
    ${getJS()}
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
function getCSS() {
  return `
/* ========================================================================
   TWLD - Design Tokens & Reset
   ======================================================================== */

:root {
  /* Background layers */
  --bg-deep:       #0d0d0d;
  --bg-primary:    #141414;
  --bg-card:       #1a1a1a;
  --bg-card-hover: #222222;
  --bg-elevated:   #252525;

  /* Text */
  --text-primary:   #e8e0d4;
  --text-secondary: #a89f91;
  --text-muted:     #6b6359;

  /* Accent — saffron / amber */
  --accent:         #d4943a;
  --accent-bright:  #e8a94a;
  --accent-dim:     #a06e28;
  --accent-glow:    rgba(212, 148, 58, 0.15);

  /* Semantic */
  --verified:       #4ade80;
  --graphic-warn:   #ef4444;
  --graphic-bg:     rgba(239, 68, 68, 0.08);

  /* Spine */
  --spine-color:    #2a2520;
  --spine-dot:      #d4943a;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
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
  background: var(--bg-deep);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

/* ========================================================================
   Header
   ======================================================================== */

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(13, 13, 13, 0.85);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border-bottom: 1px solid rgba(212, 148, 58, 0.12);
}

.header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--accent-bright);
  text-shadow: 0 0 30px rgba(212, 148, 58, 0.3);
}

.header-tagline {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 2px;
  letter-spacing: 0.02em;
}

/* CW Toggle */
.cw-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.toggle-icon { font-size: 1rem; }

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--text-muted);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  outline: none;
}

.toggle-switch.active {
  background: var(--accent);
  border-color: var(--accent-bright);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--text-primary);
  border-radius: 50%;
  transition: transform 0.3s var(--ease-out);
  pointer-events: none;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
}

/* ========================================================================
   Tag Filter Bar
   ======================================================================== */

.tag-filter-bar {
  position: sticky;
  top: 65px;
  z-index: 90;
  background: rgba(13, 13, 13, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.tag-filter-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 0.25rem;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s var(--ease-out);
  user-select: none;
}

.tag-pill:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.1);
}

.tag-pill.active {
  background: var(--accent);
  color: var(--bg-deep);
  border-color: var(--accent-bright);
  font-weight: 600;
}

/* ========================================================================
   Timeline
   ======================================================================== */

.timeline-container {
  position: relative;
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  min-height: 50vh;
}

.timeline-spine {
  position: absolute;
  left: 28px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--spine-color) 5%,
    var(--spine-color) 95%,
    transparent 100%
  );
}

.timeline-events {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ========================================================================
   Event Card
   ======================================================================== */

.event-card {
  position: relative;
  margin-left: 52px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  transition: all 0.4s var(--ease-out);
  opacity: 0;
  transform: translateY(24px);
}

.event-card.visible {
  opacity: 1;
  transform: translateY(0);
}

.event-card:hover {
  border-color: rgba(212, 148, 58, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 148, 58, 0.08);
}

/* Timeline dot */
.event-card::before {
  content: '';
  position: absolute;
  left: -40px;
  top: 2rem;
  width: 12px;
  height: 12px;
  background: var(--bg-deep);
  border: 2px solid var(--spine-dot);
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 0 12px rgba(212, 148, 58, 0.3);
  transition: all 0.3s var(--ease-out);
}

.event-card:hover::before {
  background: var(--accent);
  box-shadow: 0 0 20px rgba(212, 148, 58, 0.5);
  transform: scale(1.2);
}

/* Connector line from spine to card */
.event-card::after {
  content: '';
  position: absolute;
  left: -28px;
  top: calc(2rem + 5px);
  width: 28px;
  height: 2px;
  background: var(--spine-color);
}

/* Card elements */
.event-date {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.event-date-icon {
  font-size: 0.85rem;
}

.event-location {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.event-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.35;
  margin-bottom: 0.75rem;
}

.event-description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.25rem;
}

/* Tags inside card */
.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.event-tag {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  background: rgba(212, 148, 58, 0.1);
  color: var(--accent-bright);
  border-radius: 12px;
  border: 1px solid rgba(212, 148, 58, 0.15);
}

/* Meta line */
.event-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--verified);
  font-weight: 600;
}

.verified-icon {
  font-size: 0.85rem;
}

/* ========================================================================
   Image Gallery (inside card)
   ======================================================================== */

.event-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 1.25rem;
  margin-bottom: 1rem;
}

.gallery-thumb {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s var(--ease-out);
}

.gallery-thumb:hover {
  border-color: var(--accent);
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ========================================================================
   Content Warning Overlay
   ======================================================================== */

.cw-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 10;
  transition: opacity 0.4s var(--ease-out);
  padding: 2rem;
}

.cw-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.cw-warn-icon {
  font-size: 2rem;
  filter: grayscale(0.3);
}

.cw-warn-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  max-width: 280px;
  line-height: 1.5;
}

.cw-reveal-btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: var(--text-primary);
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.25s var(--ease-out);
}

.cw-reveal-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
}

/* ========================================================================
   Lightbox
   ======================================================================== */

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s var(--ease-out);
}

.lightbox-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 2.5rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  z-index: 10;
  line-height: 1;
}

.lightbox-close:hover { color: var(--text-primary); }

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 3rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  line-height: 1;
}

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.lightbox-prev { left: 1.5rem; }
.lightbox-next { right: 1.5rem; }

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: var(--radius-sm);
  user-select: none;
}

.lightbox-counter {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* ========================================================================
   Empty State
   ======================================================================== */

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 400px;
  margin: 0 auto;
}

.empty-state.hidden { display: none; }

.empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }

.empty-text {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 1.25rem;
}

.empty-reset {
  padding: 0.5rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: var(--accent-bright);
  background: rgba(212, 148, 58, 0.1);
  border: 1px solid rgba(212, 148, 58, 0.25);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.25s var(--ease-out);
}

.empty-reset:hover {
  background: rgba(212, 148, 58, 0.2);
}

/* ========================================================================
   Footer
   ======================================================================== */

.site-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem 1.5rem;
  text-align: center;
}

.footer-inner {
  max-width: 960px;
  margin: 0 auto;
}

.site-footer p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.footer-links {
  margin-top: 0.5rem;
}

.footer-links a {
  color: var(--accent);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: var(--accent-bright);
  text-decoration: underline;
}

.footer-sep {
  margin: 0 0.5rem;
  color: var(--text-muted);
}

/* ========================================================================
   Responsive
   ======================================================================== */

@media (max-width: 640px) {
  .header-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .toggle-text { display: none; }

  .tag-filter-bar { top: 90px; }

  .timeline-spine { left: 16px; }

  .event-card {
    margin-left: 36px;
    padding: 1.25rem;
  }

  .event-card::before { left: -30px; width: 10px; height: 10px; }
  .event-card::after  { left: -20px; width: 20px; }

  .event-title { font-size: 1.1rem; }

  .lightbox-nav { width: 44px; height: 44px; font-size: 2rem; }
  .lightbox-prev { left: 0.5rem; }
  .lightbox-next { right: 0.5rem; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .event-card { opacity: 1; transform: none; }
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

  // ---- DOM refs ----
  var timelineEl      = document.getElementById('timeline-events');
  var tagBarInner     = document.querySelector('.tag-filter-inner');
  var cwToggle        = document.getElementById('cw-checkbox');
  var emptyState      = document.getElementById('empty-state');
  var emptyReset      = document.getElementById('empty-reset');
  var lightbox        = document.getElementById('lightbox');
  var lightboxImg     = document.getElementById('lightbox-img');
  var lightboxCounter = document.getElementById('lightbox-counter');
  var lightboxClose   = document.getElementById('lightbox-close');
  var lightboxPrev    = document.getElementById('lightbox-prev');
  var lightboxNext    = document.getElementById('lightbox-next');

  // Lightbox state
  var lbImages = [];
  var lbIndex  = 0;

  // ---- Build tag set ----
  var allTags = new Set();
  events.forEach(function (ev) {
    (ev.tags || []).forEach(function (t) { allTags.add(t); });
  });

  // Sort tags alphabetically and render pills
  Array.from(allTags).sort().forEach(function (tag) {
    var btn = document.createElement('button');
    btn.className = 'tag-pill';
    btn.setAttribute('data-tag', tag);
    btn.id = 'tag-' + tag;
    btn.textContent = tag;
    btn.addEventListener('click', function () { filterByTag(tag); });
    tagBarInner.appendChild(btn);
  });

  document.getElementById('tag-all').addEventListener('click', function () {
    filterByTag('all');
  });

  // ---- Render timeline cards ----
  function renderTimeline() {
    timelineEl.innerHTML = '';
    var visibleCount = 0;

    events.forEach(function (ev, idx) {
      if (activeTagFilter !== 'all') {
        if (!ev.tags || ev.tags.indexOf(activeTagFilter) === -1) return;
      }
      visibleCount++;

      var card = document.createElement('article');
      card.className = 'event-card';
      card.setAttribute('data-id', ev.id);
      card.setAttribute('data-graphic', ev.graphic_content ? 'true' : 'false');
      card.id = 'event-' + ev.id;

      // Format date
      var dateObj = new Date(ev.date + 'T00:00:00Z');
      var dateStr = dateObj.toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'UTC'
      });

      var html = '';

      // Date
      html += '<div class="event-date"><span class="event-date-icon">◆</span> ' + escHtml(dateStr) + '</div>';

      // Location
      html += '<div class="event-location">📍 ' + escHtml(ev.location) + '</div>';

      // Title
      html += '<h2 class="event-title">' + escHtml(ev.title) + '</h2>';

      // Description
      html += '<p class="event-description">' + escHtml(ev.description) + '</p>';

      // Tags
      if (ev.tags && ev.tags.length) {
        html += '<div class="event-tags">';
        ev.tags.forEach(function (t) {
          html += '<span class="event-tag">' + escHtml(t) + '</span>';
        });
        html += '</div>';
      }

      // Image gallery
      if (ev.images && ev.images.length) {
        html += '<div class="event-gallery">';
        ev.images.forEach(function (img, imgIdx) {
          var src = 'images/' + img;
          html += '<div class="gallery-thumb" data-event-id="' + escAttr(ev.id) + '" data-img-index="' + imgIdx + '">';
          html += '<img src="' + escAttr(src) + '" alt="Photo from ' + escAttr(ev.title) + '" loading="lazy">';
          html += '</div>';
        });
        html += '</div>';
      }

      // Meta
      html += '<div class="event-meta">';
      if (ev.verified) {
        html += '<span class="verified-badge"><span class="verified-icon">✓</span> Verified</span>';
      }
      html += '<span>Contributed by ' + escHtml(ev.contributor) + '</span>';
      html += '</div>';

      // CW overlay
      if (ev.graphic_content) {
        html += '<div class="cw-overlay' + (!cwEnabled || revealedCards.has(ev.id) ? ' hidden' : '') + '" data-cw-for="' + escAttr(ev.id) + '">';
        html += '<span class="cw-warn-icon">⚠️</span>';
        html += '<p class="cw-warn-text">This entry contains graphic content depicting violence or injury.</p>';
        html += '<button class="cw-reveal-btn" data-reveal="' + escAttr(ev.id) + '">Show this entry</button>';
        html += '</div>';
      }

      card.innerHTML = html;
      timelineEl.appendChild(card);
    });

    // Empty state
    if (visibleCount === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }

    // Observe for scroll animation
    observeCards();

    // Bind gallery clicks
    bindGalleryClicks();

    // Bind CW reveal buttons
    bindCWReveals();
  }

  // ---- Tag filtering ----
  function filterByTag(tag) {
    activeTagFilter = tag;
    // Update active pill
    var pills = document.querySelectorAll('.tag-pill');
    pills.forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-tag') === tag);
    });
    renderTimeline();
  }

  emptyReset.addEventListener('click', function () {
    filterByTag('all');
  });

  // ---- CW toggle ----
  cwToggle.addEventListener('click', function () {
    cwEnabled = !cwEnabled;
    cwToggle.classList.toggle('active', cwEnabled);
    cwToggle.setAttribute('aria-checked', cwEnabled ? 'true' : 'false');
    updateCWOverlays();
  });

  function updateCWOverlays() {
    var overlays = document.querySelectorAll('.cw-overlay');
    overlays.forEach(function (ov) {
      var evId = ov.getAttribute('data-cw-for');
      if (!cwEnabled || revealedCards.has(evId)) {
        ov.classList.add('hidden');
      } else {
        ov.classList.remove('hidden');
      }
    });
  }

  function bindCWReveals() {
    var btns = document.querySelectorAll('.cw-reveal-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var evId = btn.getAttribute('data-reveal');
        revealedCards.add(evId);
        updateCWOverlays();
      });
    });
  }

  // ---- Intersection Observer for scroll animations ----
  function observeCards() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all
      document.querySelectorAll('.event-card').forEach(function (c) {
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
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.event-card:not(.visible)').forEach(function (c) {
      observer.observe(c);
    });
  }

  // ---- Gallery / Lightbox ----
  function bindGalleryClicks() {
    var thumbs = document.querySelectorAll('.gallery-thumb');
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var evId = thumb.getAttribute('data-event-id');
        var imgIdx = parseInt(thumb.getAttribute('data-img-index'), 10);
        var ev = events.find(function (e) { return e.id === evId; });
        if (!ev || !ev.images) return;

        lbImages = ev.images.map(function (img) {
          return 'images/' + img;
        });
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

  // Keyboard nav
  document.addEventListener('keydown', function (e) {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; showLightboxImage(); }
    if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbImages.length; showLightboxImage(); }
  });

  // Touch swipe support
  var touchStartX = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; }
      else        { lbIndex = (lbIndex + 1) % lbImages.length; }
      showLightboxImage();
    }
  }, { passive: true });

  // ---- Helpers ----
  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function escAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- Init ----
  renderTimeline();
})();
`;
}
