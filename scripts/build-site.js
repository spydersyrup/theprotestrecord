#!/usr/bin/env node

/**
 * build-site.js
 *
 * Reads every JSON file from data/events/, sorts them newest-first,
 * and generates docs/index.html and category pages with the event data embedded.
 * Also copies referenced images into docs/images/.
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
// 3. Generate pages
// ---------------------------------------------------------------------------

const categories = [
  { id: 'photos-videos', label: 'Photos & Videos' },
  { id: 'stories', label: 'Stories' },
  { id: 'art-memes', label: 'Art & Memes' },
  { id: 'news-articles', label: 'News Articles' }
];

// Generate Homepage
const homepageHTML = buildHTML(events, 'home', null, './', categories);
fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), homepageHTML, 'utf-8');

// Generate Category Pages
for (const cat of categories) {
  const catDir = path.join(DOCS_DIR, cat.id);
  fs.mkdirSync(catDir, { recursive: true });
  
  const catHTML = buildHTML(events, 'category', cat.id, '../', categories);
  fs.writeFileSync(path.join(catDir, 'index.html'), catHTML, 'utf-8');
}

// Generate Submit Page
const submitDir = path.join(DOCS_DIR, 'submit');
fs.mkdirSync(submitDir, { recursive: true });
const submitHTML = buildHTML(events, 'submit', null, '../', categories);
fs.writeFileSync(path.join(submitDir, 'index.html'), submitHTML, 'utf-8');

fs.writeFileSync(path.join(DOCS_DIR, '.nojekyll'), '', 'utf-8');

// Copy Shared Assets to docs/
fs.copyFileSync(path.join(__dirname, '../src/styles.css'), path.join(DOCS_DIR, 'styles.css'));
fs.copyFileSync(path.join(__dirname, '../src/main.js'), path.join(DOCS_DIR, 'main.js'));

console.log(`Generated homepage, 4 category pages, submit page, and shared assets`);

// ---------------------------------------------------------------------------
// HTML Template
// ---------------------------------------------------------------------------

function buildHTML(events, pageType, categoryId, depth, categories) {
  const eventsJSON = JSON.stringify(events);
  const categoriesJSON = JSON.stringify(categories);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TWLD - The World's Largest Demockracy</title>
  <meta name="description" content="Community archive documenting India's youth-led protest movement. A chronological record of events, verified by contributors.">
  <meta property="og:title" content="TWLD - The World's Largest Demockracy">
  <meta property="og:description" content="Community archive documenting India's youth-led protest movement.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${depth}styles.css?v=${Date.now()}">
  <script src="https://unpkg.com/lucide@latest"></script>
  <script async src="https://tally.so/widgets/embed.js"></script>
</head>
<body>
  
  <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle menu">
    <span class="hamburger"></span>
    <span class="hamburger"></span>
    <span class="hamburger"></span>
  </button>

  <div class="app-container">
    <aside class="sidebar" id="sidebar">
      <header class="masthead" id="site-header">
        <div class="masthead-brand">
          <h1 class="masthead-title"><a href="${depth}" class="masthead-link">TWLD</a></h1>
          <p class="masthead-sub">The World's Largest Demockracy / Community Protest Archive</p>
        </div>
      </header>

      ${pageType !== 'submit' ? `
      <div class="search-container">
        <i data-lucide="search" class="search-icon"></i>
        <input type="text" id="search-input" class="search-input" placeholder="Search archive..." aria-label="Search">
        <button id="clear-search" class="clear-search-btn hidden" aria-label="Clear search">
          <i data-lucide="x"></i>
        </button>
      </div>
      ` : ''}

      <nav class="sidebar-nav">
        <ul class="nav-links">
          <li><a href="${depth}" class="nav-link ${pageType === 'home' ? 'active' : ''}">Home</a></li>
          ${categories.map(c => `
          <li><a href="${depth}${c.id}/" class="nav-link ${categoryId === c.id ? 'active' : ''}">${c.label}</a></li>
          `).join('')}
          <li><a href="${depth}submit/" class="nav-link ${pageType === 'submit' ? 'active' : ''}">Submit</a></li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-footer-actions">
          <button
            type="button"
            role="switch"
            aria-checked="true"
            aria-label="Toggle content warnings"
            class="cw-toggle active"
            id="cw-checkbox"
          >
            <i data-lucide="eye-off"></i>
            <span>Content warnings ON</span>
          </button>
          <button
            type="button"
            aria-label="Toggle dark mode"
            class="theme-toggle"
            id="theme-toggle"
          >
            <i data-lucide="moon"></i>
          </button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      ${pageType === 'submit' ? `
        <div class="submit-page">
          <p class="submit-intro">Were you there? Add what you saw.</p>
          <div class="submit-options">
            <div class="submit-card">
              <h3>Contribute via GitHub</h3>
              <p>For written accounts, art, memes, or news article summaries. Open a Pull Request directly against the repository if you are comfortable with GitHub.</p>
              <a href="https://github.com/spydersyrup/TWLD" target="_blank" rel="noopener noreferrer" class="submit-btn-outline">View GitHub Repo &rarr;</a>
              <a href="https://github.com/spydersyrup/TWLD/blob/main/contributing.md" target="_blank" rel="noopener noreferrer" class="submit-link">Read the contribution guide</a>
            </div>
            <div class="submit-card tally-container">
              <h3>Submit a photo or video</h3>
              <p>No GitHub needed. Upload raw footage or images directly via our submission form. We will review and verify before it goes live.</p>
              <div style="margin-top: 2rem;">
                <iframe data-tally-src="https://tally.so/embed/5BgpNv?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&formEventsForwarding=1" loading="lazy" width="100%" height="1808" frameborder="0" marginheight="0" marginwidth="0" title="TWLD — Submit a Photo or Video"></iframe>
                <script>var d=document,w="https://tally.so/widgets/embed.js",v=function(){"undefined"!=typeof Tally?Tally.loadEmbeds():d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((function(e){e.src=e.dataset.tallySrc}))};if("undefined"!=typeof Tally)v();else if(d.querySelector('script[src="'+w+'"]')==null){var s=d.createElement("script");s.src=w,s.onload=v,s.onerror=v,d.body.appendChild(s);}</script>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      ${pageType === 'home' ? `
        <div class="home-intro">
          <p>In July 2026, thousands of young Indians took to the streets. This is a record of what happened, built by the people who were there. Every entry is submitted, reviewed, and kept accurate by the community, not by any newsroom, party, or platform.</p>
          <p class="home-stats">
            ${events.length} ${events.length === 1 ? 'entry' : 'entries'} across ${categories.length} categories
            ${events.length > 0 ? ` &bull; Last updated ${new Date(events[0].date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}` : ''}
          </p>
          <!-- Quick City Filters -->
          <div class="city-filters" id="city-filters">
            <span class="city-filters-label">Hotspots:</span>
            <!-- Rendered by JS -->
          </div>
        </div>
      ` : ''}
      
      ${pageType !== 'submit' ? `
      <div class="archive" id="timeline-container">
        <!-- Rendered by JS -->
      </div>
      ` : ''}
    </main>
  </div>

  <div class="lightbox-overlay hidden" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
    <button class="lightbox-close" id="lightbox-close" aria-label="Close"><i data-lucide="x"></i></button>
    <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Previous image"><i data-lucide="chevron-left"></i></button>
    <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Next image"><i data-lucide="chevron-right"></i></button>
    <img class="lightbox-img" id="lightbox-img" src="" alt="">
    <div class="lightbox-counter" id="lightbox-counter"></div>
  </div>

  <noscript>
    <div style="padding:3rem;text-align:center;font-family:Inter,sans-serif;">
      <h2>JavaScript Required</h2>
      <p>This archive requires JavaScript to render entries. Please enable JavaScript and reload.</p>
    </div>
  </noscript>

  <script>
    window.__EVENTS__ = ${eventsJSON};
    window.__CATEGORIES__ = ${categoriesJSON};
    window.__PAGE_TYPE__ = '${pageType}';
    window.__CATEGORY_ID__ = ${categoryId ? `'${categoryId}'` : 'null'};
    window.__DEPTH__ = '${depth}';
  </script>
  <script src="${depth}main.js"></script>
</body>
</html>`;
}
