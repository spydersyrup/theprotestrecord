
(function () {
  'use strict';

  var events = window.__EVENTS__ || [];
  var categories = window.__CATEGORIES__ || [];
  var pageType = window.__PAGE_TYPE__ || 'home';
  var categoryId = window.__CATEGORY_ID__;
  var depth = window.__DEPTH__ || './';

  var timelineEl = document.getElementById('timeline-events');
  var emptyState = document.getElementById('empty-state');
  var cwToggle = document.getElementById('cw-checkbox');
  var mobileToggle = document.getElementById('mobile-menu-toggle');
  var sidebar = document.getElementById('sidebar');

  var cwEnabled = true;
  var revealedCards = new Set();
  
  var observer;

  // Mobile menu
  mobileToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });

  // CW preference
  try {
    var storedCw = localStorage.getItem('twld-cw');
    if (storedCw === 'off') {
      cwEnabled = false;
      cwToggle.classList.remove('active');
      cwToggle.textContent = 'Content warnings OFF';
      cwToggle.setAttribute('aria-checked', 'false');
    }
  } catch (e) {}

  cwToggle.addEventListener('click', function () {
    cwEnabled = !cwEnabled;
    cwToggle.classList.toggle('active', cwEnabled);
    cwToggle.textContent = cwEnabled ? 'Content warnings ON' : 'Content warnings OFF';
    cwToggle.setAttribute('aria-checked', cwEnabled ? 'true' : 'false');
    try {
      localStorage.setItem('twld-cw', cwEnabled ? 'on' : 'off');
    } catch (e) {}
    renderTimeline();
  });



  function renderTimeline() {
    timelineEl.innerHTML = '';
    var visibleCount = 0;

    var catsToRender = categories;
    if (pageType === 'category') {
      catsToRender = categories.filter(function(c) { return c.id === categoryId; });
    }

    catsToRender.forEach(function (cat) {
      var catEvents = events.filter(function (ev) {
        return ev.category === cat.id;
      });
      
      var totalInCat = catEvents.length;
      var visibleCatEvents = catEvents;

      if (visibleCatEvents.length === 0 && pageType !== 'home') return;
      
      if (pageType === 'home') {
        visibleCatEvents = visibleCatEvents.slice(0, 3);
      }

      var catSection = document.createElement('section');
      catSection.className = 'category-section';

      var catEyebrow = document.createElement('span');
      catEyebrow.className = 'category-eyebrow';
      catEyebrow.textContent = 'SECTION';
      catSection.appendChild(catEyebrow);

      var catHeader = document.createElement('h2');
      catHeader.className = 'category-header';
      var entryText = totalInCat === 1 ? 'entry' : 'entries';
      catHeader.innerHTML = cat.label + ' <span class="category-count">' + totalInCat + ' ' + entryText + '</span>';
      catSection.appendChild(catHeader);

      if (visibleCatEvents.length === 0) {
        var emptyP = document.createElement('p');
        emptyP.className = 'category-empty';
        emptyP.textContent = 'No entries yet.';
        emptyP.style.fontStyle = 'italic';
        emptyP.style.color = 'var(--text-muted)';
        emptyP.style.marginBottom = '2rem';
        catSection.appendChild(emptyP);
      } else {
        visibleCatEvents.forEach(function (ev) {
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

        html += '<h3 class="entry-title">' + escHtml(ev.title) + '</h3>';
        
        if (pageType !== 'home') {
          html += '<p class="entry-body">' + escHtml(ev.description) + '</p>';

          if (ev.source_url) {
            html += '<a href="' + escAttr(ev.source_url) + '" target="_blank" rel="noopener noreferrer" class="entry-source-link">Read full article &rarr;</a>';
          }

          // Image gallery
          if (ev.images && ev.images.length) {
            html += '<div class="entry-gallery">';
            ev.images.forEach(function (img, imgIdx) {
              var src = depth + 'images/' + img;
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
        }

        html += '</div>'; // close .entry-content

        card.innerHTML = html;
        catSection.appendChild(card);
      });
      } // end else

      if (pageType === 'home') {
        var viewAll = document.createElement('a');
        viewAll.className = 'view-all-link';
        viewAll.href = depth + cat.id + '/';
        viewAll.innerHTML = 'View all ' + cat.label + ' &rarr;';
        catSection.appendChild(viewAll);
      }

      timelineEl.appendChild(catSection);
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



  // Escaping helpers
  function escHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function escAttr(str) { return escHtml(str); }

  // Intersection Observer for fade in
  function observeCards() {
    if (observer) observer.disconnect();
    
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.entry').forEach(function(e) { e.classList.add('visible'); });
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) {
          ent.target.classList.add('visible');
          observer.unobserve(ent.target);
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0 });

    document.querySelectorAll('.entry').forEach(function(e) { observer.observe(e); });
  }

  // CW Reveals
  function bindCWReveals() {
    var btns = document.querySelectorAll('.cw-reveal');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-reveal');
        revealedCards.add(id);
        
        var card = document.getElementById('event-' + id);
        if (card) {
          var bar = card.querySelector('.cw-bar');
          var content = card.querySelector('.entry-content');
          if (bar) bar.classList.add('hidden');
          if (content) content.classList.remove('hidden');
        }
      });
    });
  }

  // Lightbox
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightbox-img');
  var lbCounter = document.getElementById('lightbox-counter');
  
  var currentLightboxEv = null;
  var currentLightboxIdx = 0;

  function bindGalleryClicks() {
    var thumbs = document.querySelectorAll('.gallery-thumb');
    thumbs.forEach(function (th) {
      th.addEventListener('click', function () {
        var evId = th.getAttribute('data-event-id');
        var idx = parseInt(th.getAttribute('data-img-index'), 10);
        
        var ev = events.find(function(e) { return e.id === evId; });
        if (!ev || !ev.images || ev.images.length === 0) return;
        
        currentLightboxEv = ev;
        showLightboxImage(idx);
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  function showLightboxImage(idx) {
    if (!currentLightboxEv) return;
    var imgs = currentLightboxEv.images;
    if (idx < 0) idx = imgs.length - 1;
    if (idx >= imgs.length) idx = 0;
    
    currentLightboxIdx = idx;
    lbImg.src = depth + 'images/' + imgs[idx];
    lbImg.alt = currentLightboxEv.title;
    lbCounter.textContent = (idx + 1) + ' / ' + imgs.length;
  }

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', function() { showLightboxImage(currentLightboxIdx - 1); });
  document.getElementById('lightbox-next').addEventListener('click', function() { showLightboxImage(currentLightboxIdx + 1); });
  
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function(e) {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLightboxImage(currentLightboxIdx - 1);
    if (e.key === 'ArrowRight') showLightboxImage(currentLightboxIdx + 1);
  });

  function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Init
  if (pageType !== 'submit') {
    renderTimeline();
  }

})();
