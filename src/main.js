(function () {
  'use strict';

  var events = window.__EVENTS__ || [];
  var categories = window.__CATEGORIES__ || [];
  var pageType = window.__PAGE_TYPE__ || 'home';
  var categoryId = window.__CATEGORY_ID__;
  var depth = window.__DEPTH__ || './';

  var timelineEl = document.getElementById('timeline-container');
  var emptyState = document.getElementById('empty-state');
  var cwToggle = document.getElementById('cw-checkbox');
  var mobileToggle = document.getElementById('mobile-menu-toggle');
  var sidebar = document.getElementById('sidebar');
  
  var searchInput = document.getElementById('search-input');
  var clearSearchBtn = document.getElementById('clear-search');
  var themeToggle = document.getElementById('theme-toggle');
  var emptyResetBtn = document.getElementById('empty-reset');

  var cwEnabled = true;
  var revealedCards = new Set();
  var observer;
  
  var searchQuery = '';
  var activeTag = null;
  var eventsPerPage = 20;
  var visibleLimits = {};
  var loadMoreObserver;

  function initLucide() {
    if (window.lucide) window.lucide.createIcons();
  }

  // Dark Mode
  function setTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      if (themeToggle) themeToggle.innerHTML = '<i data-lucide="sun"></i>';
    } else {
      document.documentElement.classList.remove('dark-mode');
      if (themeToggle) themeToggle.innerHTML = '<i data-lucide="moon"></i>';
    }
    initLucide();
    try { localStorage.setItem('twld-theme', isDark ? 'dark' : 'light'); } catch (e) {}
  }
  
  try {
    var storedTheme = localStorage.getItem('twld-theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme(true);
    }
  } catch (e) {}

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      var isDark = document.documentElement.classList.contains('dark-mode');
      setTheme(!isDark);
    });
  }

  // Mobile menu
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchQuery = e.target.value.toLowerCase().trim();
      clearSearchBtn.classList.toggle('hidden', searchQuery === '');
      resetLimits();
      renderTimeline();
    });
    
    clearSearchBtn.addEventListener('click', function() {
      searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      resetLimits();
      renderTimeline();
    });
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', function() {
      searchQuery = '';
      activeTag = null;
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
      resetLimits();
      renderTimeline();
    });
  }

  // CW preference
  try {
    var storedCw = localStorage.getItem('twld-cw');
    if (storedCw === 'off') {
      cwEnabled = false;
      if (cwToggle) {
        cwToggle.classList.remove('active');
        cwToggle.innerHTML = '<i data-lucide="eye"></i><span>Content warnings OFF</span>';
        cwToggle.setAttribute('aria-checked', 'false');
      }
    }
  } catch (e) {}

  if (cwToggle) {
    cwToggle.addEventListener('click', function () {
      cwEnabled = !cwEnabled;
      cwToggle.classList.toggle('active', cwEnabled);
      if (cwEnabled) {
        cwToggle.innerHTML = '<i data-lucide="eye-off"></i><span>Content warnings ON</span>';
      } else {
        cwToggle.innerHTML = '<i data-lucide="eye"></i><span>Content warnings OFF</span>';
      }
      cwToggle.setAttribute('aria-checked', cwEnabled ? 'true' : 'false');
      try { localStorage.setItem('twld-cw', cwEnabled ? 'on' : 'off'); } catch (e) {}
      initLucide();
      renderTimeline();
    });
  }

  function resetLimits() {
    visibleLimits = {};
  }
  
  function getLimit(catId) {
    return visibleLimits[catId] || eventsPerPage;
  }

  function renderTimeline() {
    if (!timelineEl) return;
    timelineEl.innerHTML = '';
    var visibleCount = 0;

    var catsToRender = categories;
    if (pageType === 'category') {
      catsToRender = categories.filter(function(c) { return c.id === categoryId; });
    }

    // Active tag header
    if (activeTag && pageType !== 'home') {
      var tagHeader = document.createElement('div');
      tagHeader.className = 'active-tag-filter';
      tagHeader.innerHTML = 'Showing entries for: ' + escHtml(activeTag) + 
        ' <button aria-label="Clear filter" data-clear-tag><i data-lucide="x"></i></button>';
      timelineEl.appendChild(tagHeader);
    }

    // City Filters for Home
    if (pageType === 'home' && !activeTag && !searchQuery) {
      var cityCounts = {};
      events.forEach(function(ev) {
        if (!ev.location) return;
        var parts = ev.location.split(',');
        var city = parts[parts.length - 1].trim();
        if (city) {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
      });
      var sortedCities = Object.keys(cityCounts).sort(function(a, b) {
        return cityCounts[b] - cityCounts[a];
      }).slice(0, 4);

      if (sortedCities.length > 0) {
        var cityContainer = document.createElement('div');
        cityContainer.className = 'city-filters-container';
        
        sortedCities.forEach(function(city) {
          var pill = document.createElement('button');
          pill.className = 'city-pill';
          pill.textContent = city;
          pill.addEventListener('click', function() {
            searchQuery = city.toLowerCase();
            if (searchInput) searchInput.value = city;
            if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
            resetLimits();
            renderTimeline();
          });
          cityContainer.appendChild(pill);
        });
        
        timelineEl.appendChild(cityContainer);
      }
    }

    catsToRender.forEach(function (cat) {
      var catEvents = events.filter(function (ev) {
        if (ev.category !== cat.id) return false;
        
        // Tag filter
        if (activeTag && (!ev.tags || !ev.tags.includes(activeTag))) return false;
        
        // Search filter
        if (searchQuery) {
          var searchable = (
            ev.title + ' ' + 
            ev.description + ' ' + 
            ev.location + ' ' + 
            (ev.tags || []).join(' ') + ' ' + 
            ev.contributor
          ).toLowerCase();
          if (searchable.indexOf(searchQuery) === -1) return false;
        }
        
        return true;
      });
      
      var totalInCat = catEvents.length;
      
      var limit = getLimit(cat.id);
      var visibleCatEvents = catEvents;
      var hasMore = false;
      
      if (pageType === 'home') {
        visibleCatEvents = visibleCatEvents.slice(0, 3);
      } else {
        if (visibleCatEvents.length > limit) {
          visibleCatEvents = visibleCatEvents.slice(0, limit);
          hasMore = true;
        }
      }

      if (totalInCat === 0 && pageType === 'home') return; // hide empty categories on home
      
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

      if (totalInCat === 0) {
        var emptyP = document.createElement('p');
        emptyP.className = 'category-empty';
        if (searchQuery || activeTag) {
          emptyP.textContent = 'No entries match your search or filter.';
        } else {
          emptyP.textContent = 'No items found yet.';
        }
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

          html += '<time class="entry-date">' + escHtml(dateStr) + '</time>';
          html += '<div class="entry-location">' + escHtml(ev.location) + '</div>';

          if (ev.graphic_content) {
            html += '<div class="cw-bar' + (isHidden ? '' : ' hidden') + '" data-cw-for="' + escAttr(ev.id) + '">';
            html += '<div class="cw-bar-inner">';
            html += '<span class="cw-label">Content Warning</span>';
            html += '<span class="cw-desc">This entry documents graphic content depicting violence or injury.</span>';
            html += '<button class="cw-reveal" data-reveal="' + escAttr(ev.id) + '">Reveal</button>';
            html += '</div></div>';
          }

          html += '<div class="entry-content' + (isHidden ? ' hidden' : '') + '">';
          html += '<h3 class="entry-title">' + escHtml(ev.title) + '</h3>';
          
          if (pageType !== 'home') {
            html += '<p class="entry-body">' + escHtml(ev.description) + '</p>';

            if (ev.source_url || ev.source_link) {
              var link = ev.source_url || ev.source_link;
              html += '<a href="' + escAttr(link) + '" target="_blank" rel="noopener noreferrer" class="entry-source-link">View original source &rarr;</a>';
            }

            if (ev.ig_handle || ev.x_handle) {
              html += '<div class="social-handles">';
              if (ev.ig_handle) {
                var cleanIg = ev.ig_handle.startsWith('@') ? ev.ig_handle.substring(1) : ev.ig_handle;
                html += '<a href="https://instagram.com/' + escAttr(cleanIg) + '" target="_blank" rel="noopener noreferrer" class="social-handle ig-handle">IG: ' + escHtml(ev.ig_handle) + '</a>';
              }
              if (ev.x_handle) {
                var cleanX = ev.x_handle.startsWith('@') ? ev.x_handle.substring(1) : ev.x_handle;
                html += '<a href="https://x.com/' + escAttr(cleanX) + '" target="_blank" rel="noopener noreferrer" class="social-handle x-handle">X: ' + escHtml(ev.x_handle) + '</a>';
              }
              html += '</div>';
            }

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

            if (ev.tags && ev.tags.length) {
              html += '<div class="entry-tags">';
              ev.tags.forEach(function(t) {
                var isActive = activeTag === t;
                html += '<button class="tag-btn ' + (isActive ? 'active' : '') + '" data-tag="' + escAttr(t) + '">#' + escHtml(t) + '</button> ';
              });
              html += '</div>';
            }

            html += '<div class="entry-meta">';
            if (ev.verified) {
              html += '<span class="verified-stamp">Verified</span>';
            }
            html += '<span>Contributed by ' + escHtml(ev.contributor) + '</span>';
            
            // Share Button
            html += '<button class="share-btn" data-share-id="' + escAttr(ev.id) + '" data-share-title="' + escAttr(ev.title) + '" data-share-cat="' + escAttr(cat.id) + '">';
            html += '<i data-lucide="share-2"></i> Share';
            html += '</button>';

            html += '</div>';
          }

          html += '</div>';
          card.innerHTML = html;
          catSection.appendChild(card);
        });
      }

      if (hasMore && pageType !== 'home') {
        var trigger = document.createElement('div');
        trigger.id = 'load-more-trigger';
        trigger.setAttribute('data-cat-id', cat.id);
        catSection.appendChild(trigger);
      }

      if (pageType === 'home' && totalInCat > 0) {
        var viewAll = document.createElement('a');
        viewAll.className = 'view-all-link';
        viewAll.href = depth + cat.id + '/';
        viewAll.innerHTML = 'View all ' + cat.label + ' &rarr;';
        catSection.appendChild(viewAll);
      }

      timelineEl.appendChild(catSection);
    });

    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
        var emptyP = emptyState.querySelector('.empty-text');
        
        if (searchQuery || activeTag) {
          if (emptyP) emptyP.textContent = 'No entries match your search.';
          if (emptyResetBtn) emptyResetBtn.classList.remove('hidden');
        } else {
          if (emptyP) emptyP.textContent = 'No entries found.';
          if (emptyResetBtn) emptyResetBtn.classList.add('hidden');
        }
      } else {
        emptyState.classList.add('hidden');
      }
    }

    observeCards();
    observeLoadMore();
    bindGalleryClicks();
    bindCWReveals();
    bindTags();
    bindShares();
    initLucide();
  }

  // Tags
  function bindTags() {
    var btns = document.querySelectorAll('.tag-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = btn.getAttribute('data-tag');
        activeTag = activeTag === tag ? null : tag;
        resetLimits();
        renderTimeline();
      });
    });

    var clearTagBtn = document.querySelector('[data-clear-tag]');
    if (clearTagBtn) {
      clearTagBtn.addEventListener('click', function() {
        activeTag = null;
        resetLimits();
        renderTimeline();
      });
    }
  }

  // Share
  function bindShares() {
    var btns = document.querySelectorAll('.share-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-share-id');
        var cat = btn.getAttribute('data-share-cat');
        var title = btn.getAttribute('data-share-title');
        
        // build full url using window.location.origin
        // depth logic means we construct based on site structure
        // /categoryId/#event-id
        var origin = window.location.origin;
        var pathname = window.location.pathname;
        
        // If we are deep (e.g. in /stories/), base is parent
        var base = pageType === 'home' ? pathname : pathname.substring(0, pathname.lastIndexOf('/', pathname.length - 2) + 1);
        if (!base.endsWith('/')) base += '/';
        var url = origin + base + cat + '/#event-' + id;

        if (navigator.share) {
          navigator.share({
            title: title + ' - TWLD',
            url: url
          }).catch(function(e){});
        } else {
          navigator.clipboard.writeText(url).then(function() {
            var icon = btn.querySelector('i');
            if (icon) btn.innerHTML = '<i data-lucide="check"></i> Copied';
            initLucide();
            setTimeout(function() {
              btn.innerHTML = '<i data-lucide="share-2"></i> Share';
              initLucide();
            }, 2000);
          });
        }
      });
    });
  }

  // Infinite Scroll
  function observeLoadMore() {
    if (loadMoreObserver) loadMoreObserver.disconnect();
    
    var trigger = document.getElementById('load-more-trigger');
    if (!trigger) return;
    
    if (!('IntersectionObserver' in window)) return;

    loadMoreObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) {
          var catId = ent.target.getAttribute('data-cat-id');
          visibleLimits[catId] = getLimit(catId) + eventsPerPage;
          renderTimeline();
        }
      });
    }, { rootMargin: '0px 0px 400px 0px' });

    loadMoreObserver.observe(trigger);
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

    // only observe entries that aren't already visible
    document.querySelectorAll('.entry:not(.visible)').forEach(function(e) { observer.observe(e); });
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
        if (lightbox) {
          lightbox.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  }

  function showLightboxImage(idx) {
    if (!currentLightboxEv) return;
    var imgs = currentLightboxEv.images;
    if (idx < 0) idx = imgs.length - 1;
    if (idx >= imgs.length) idx = 0;
    
    currentLightboxIdx = idx;
    if (lbImg) {
      lbImg.src = depth + 'images/' + imgs[idx];
      lbImg.alt = currentLightboxEv.title;
    }
    if (lbCounter) {
      lbCounter.textContent = (idx + 1) + ' / ' + imgs.length;
    }
  }

  var lbClose = document.getElementById('lightbox-close');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  var lbPrev = document.getElementById('lightbox-prev');
  if (lbPrev) lbPrev.addEventListener('click', function() { showLightboxImage(currentLightboxIdx - 1); });
  var lbNext = document.getElementById('lightbox-next');
  if (lbNext) lbNext.addEventListener('click', function() { showLightboxImage(currentLightboxIdx + 1); });
  
  if (lightbox) {
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (!lightbox || lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLightboxImage(currentLightboxIdx - 1);
    if (e.key === 'ArrowRight') showLightboxImage(currentLightboxIdx + 1);
  });

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  // Init
  if (pageType !== 'submit') {
    renderTimeline();
  } else {
    initLucide();
  }

})();