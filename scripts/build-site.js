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

const Template = require('../src/template.js');

function renderSocialEmbed(url) {
  if (!url) return '';
  if (url.match(/instagram\.com\/(?:p|reel)\//)) {
    return `<div class="social-embed-wrapper"><blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin: 1px;max-width:540px;min-width:326px;padding:0;width:99.375%;width:-webkit-calc(100% - 2px);width:calc(100% - 2px);"><a href="${url}" style="background:#FFFFFF;line-height:0;padding:0 0;text-align:center;text-decoration:none;width:100%;font-family:Arial,sans-serif;font-size:14px;font-style:normal;font-weight:550;line-height:18px;">View post on Instagram</a></blockquote></div>`;
  }
  if (url.match(/(?:x\.com|twitter\.com)\/.*\/status\//)) {
    return `<div class="social-embed-wrapper"><blockquote class="twitter-tweet" data-dnt="true"><a href="${url}">View post on X</a></blockquote></div>`;
  }
  return '';
}

const EVENTS_DIR = path.join(ROOT, 'data', 'events');
const IMAGES_DIR = path.join(ROOT, 'data', 'images');
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
  { id: 'art-posters-memes', label: 'Arts - Posters & Memes' },
  { id: 'news-articles', label: 'News Article' },
  { id: 'social-links', label: 'Social Media Links' }
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
fs.copyFileSync(path.join(ROOT, 'src', 'styles.css'), path.join(DOCS_DIR, 'styles.css'));
fs.copyFileSync(path.join(ROOT, 'src', 'main.js'), path.join(DOCS_DIR, 'main.js'));
fs.copyFileSync(path.join(ROOT, 'src', 'template.js'), path.join(DOCS_DIR, 'template.js'));

// Generate Sitemap and Robots.txt
let sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemapXML += `  <url><loc>https://theprotestrecord.pages.dev/</loc></url>\n`;
sitemapXML += `  <url><loc>https://theprotestrecord.pages.dev/submit/</loc></url>\n`;
for (const cat of categories) {
  sitemapXML += `  <url><loc>https://theprotestrecord.pages.dev/${cat.id}/</loc></url>\n`;
}
sitemapXML += `</urlset>`;
fs.writeFileSync(path.join(DOCS_DIR, 'sitemap.xml'), sitemapXML, 'utf-8');
fs.writeFileSync(path.join(DOCS_DIR, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://theprotestrecord.pages.dev/sitemap.xml\n', 'utf-8');

// Generate Archive Data Export
fs.writeFileSync(path.join(DOCS_DIR, 'archive.json'), JSON.stringify(events, null, 2), 'utf-8');

// Generate CSV Data Export
const csvHeaders = ['ID', 'Date', 'Location', 'Category', 'Title', 'Description', 'Tags', 'Images', 'Graphic Content', 'Contributor', 'Verified', 'Source URL', 'Socials'];
const csvRows = [csvHeaders.join(',')];
for (const ev of events) {
  const row = [
    ev.id, ev.date, ev.location, ev.category, ev.title, ev.description,
    (ev.tags || []).join(';'), (ev.images || []).join(';'),
    ev.graphic_content ? 'TRUE' : 'FALSE', ev.contributor, ev.verified ? 'TRUE' : 'FALSE',
    ev.source_link || ev.source_url || '', ev.socials || ''
  ].map(val => {
    const str = String(val || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  });
  csvRows.push(row.join(','));
}
fs.writeFileSync(path.join(DOCS_DIR, 'archive.csv'), csvRows.join('\n'), 'utf-8');

console.log(`Generated homepage, 4 category pages, submit page, SEO files, archive data, and shared assets`);

// ---------------------------------------------------------------------------
// HTML Template
// ---------------------------------------------------------------------------

function buildHTML(events, pageType, categoryId, depth, categories) {
  const eventsJSON = JSON.stringify(events);
  const categoriesJSON = JSON.stringify(categories);

  let pageTitle = "The Protest Record";
  let pageDesc = "Community archive documenting India's youth-led protest movement. A chronological record of events, verified by contributors.";
  let pageUrl = "https://theprotestrecord.pages.dev/";
  
  if (pageType === 'category') {
    const cat = categories.find(c => c.id === categoryId);
    pageTitle = `${cat.label} | The Protest Record`;
    pageDesc = `View ${cat.label} documenting the 2026 Indian youth-led protests.`;
    pageUrl = `https://theprotestrecord.pages.dev/${cat.id}/`;
  } else if (pageType === 'submit') {
    pageTitle = "Submit Entry | The Protest Record";
    pageDesc = "Contribute your photos, videos, and stories to The Protest Record archive.";
    pageUrl = "https://theprotestrecord.pages.dev/submit/";
  }
  
  // HTML escaping for noscript fallback
  const filteredEvents = pageType === 'category' ? events.filter(e => e.category === categoryId) : events;
  
  function renderStaticTimeline() {
    let catsToRender = categories;
    if (pageType === 'category') catsToRender = [categories.find(c => c.id === categoryId)];
    
    let html = '';
    for (const cat of catsToRender) {
      const catEvents = filteredEvents.filter(e => e.category === cat.id);
      if (catEvents.length === 0 && pageType === 'home') continue;
      
      const visibleEvents = pageType === 'home' ? catEvents.slice(0, 3) : catEvents;
      const gridClass = pageType === 'home' ? ' category-section-grid' : '';
      html += `<section class="category-section${gridClass}">`;
      html += `<span class="category-eyebrow">SECTION</span>`;
      html += `<h2 class="category-header">${cat.label} <span class="category-count">${catEvents.length} ${catEvents.length === 1 ? 'entry' : 'entries'}</span></h2>`;
      
      if (visibleEvents.length === 0) {
        html += `<p class="category-empty" style="color:var(--text-muted);margin-bottom:2rem;">No items found yet.</p>`;
      } else {
        if (pageType === 'home') html += `<div class="entries-grid">`;
        for (const ev of visibleEvents) {
          html += Template.renderEventCard(ev, pageType, depth);
        }
        if (pageType === 'home') html += `</div>`;
      }
      html += `</section>`;
    }
    return html;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDesc}">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDesc}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${pageDesc}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${depth}styles.css?v=${Date.now()}">
  <script src="${depth}template.js?v=${Date.now()}"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <script async src="https://tally.so/widgets/embed.js"></script>
  <script async src="//www.instagram.com/embed.js"></script>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
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
          <h1 class="masthead-title"><a href="${depth}" class="masthead-link">The Protest Record</a></h1>
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
          <li style="margin-top: 1rem;"><span class="nav-link" style="opacity: 0.5; font-size: 0.8em; text-transform: uppercase;">Download Data</span></li>
          <li><a href="${depth}archive.json" download="the_protest_record.json" class="nav-link" style="font-size: 0.95em;"><i data-lucide="download"></i> JSON Format</a></li>
          <li><a href="${depth}archive.csv" download="the_protest_record.csv" class="nav-link" style="font-size: 0.95em;"><i data-lucide="table"></i> CSV / Excel</a></li>
          <li style="margin-top: 1rem;"><a href="https://github.com/spydersyrup/theprotestrecord" target="_blank" rel="noopener noreferrer" class="nav-link"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> View on GitHub</a></li>
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
              <a href="https://github.com/spydersyrup/theprotestrecord" target="_blank" rel="noopener noreferrer" class="submit-btn-outline">View GitHub Repo &rarr;</a>
              <a href="https://github.com/spydersyrup/theprotestrecord/blob/main/contributing.md" target="_blank" rel="noopener noreferrer" class="submit-link">Read the contribution guide</a>
            </div>
            <div class="submit-card tally-container">
              <h3>Submit a photo or video</h3>
              <p>No GitHub needed. Upload raw footage or images directly via our submission form. We will review and verify before it goes live.</p>
              <div style="margin-top: 2rem;">
                <iframe data-tally-src="https://tally.so/embed/5BgpNv?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&formEventsForwarding=1" loading="lazy" width="100%" height="1808" frameborder="0" marginheight="0" marginwidth="0" title="The Protest Record — Submit a Photo or Video"></iframe>
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
        ${renderStaticTimeline()}
      </div>
      ` : ''}
    </main>
  </div>

  <div class="lightbox-overlay hidden" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
    <button class="lightbox-close" id="lightbox-close" aria-label="Close"><i data-lucide="x"></i></button>
    <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Previous image"><i data-lucide="chevron-left"></i></button>
    <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Next image"><i data-lucide="chevron-right"></i></button>
    <div class="lightbox-media-container" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;">
      <img class="lightbox-img" id="lightbox-img" src="" alt="">
      <video class="lightbox-video hidden" id="lightbox-video" src="" controls playsinline style="max-height: 90vh; max-width: 90vw;"></video>
    </div>
    <div class="lightbox-counter" id="lightbox-counter"></div>
  </div>

  </div>

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
