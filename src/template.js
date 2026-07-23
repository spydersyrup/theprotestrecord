(function(exports) {
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderSocialEmbed(url, isDark) {
    if (!url) return '';
    var theme = isDark ? 'dark' : 'light';
    
    if (url.match(/instagram\.com\/(?:p|reel)\//)) {
      return '<div class="social-embed-wrapper"><blockquote class="instagram-media" data-instgrm-permalink="' + esc(url) + '" data-instgrm-version="14" style="background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin: 1px;max-width:540px;min-width:326px;padding:0;width:99.375%;width:-webkit-calc(100% - 2px);width:calc(100% - 2px);"><a href="' + esc(url) + '" style="background:#FFFFFF;line-height:0;padding:0 0;text-align:center;text-decoration:none;width:100%;font-family:Arial,sans-serif;font-size:14px;font-style:normal;font-weight:550;line-height:18px;">View post on Instagram</a></blockquote></div>';
    }
    if (url.match(/(?:x\.com|twitter\.com)\/.*\/status\//)) {
      return '<div class="social-embed-wrapper"><blockquote class="twitter-tweet" data-dnt="true" data-theme="' + theme + '"><a href="' + esc(url) + '">View post on X</a></blockquote></div>';
    }
    return '';
  }

  function renderEventCard(ev, pageType, depth, isDark, isHidden) {
    var dateStr = new Date(ev.date + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    var compactClass = pageType === 'home' ? ' entry-compact' : '';
    
    var html = '<article class="entry' + compactClass + '" id="event-' + ev.id + '" data-id="' + ev.id + '" data-graphic="' + (ev.graphic_content ? 'true' : 'false') + '">';
    html += '<time class="entry-date">' + esc(dateStr) + '</time>';
    html += '<div class="entry-location">' + esc(ev.location) + '</div>';
    
    if (ev.graphic_content) {
      html += '<div class="cw-bar' + (isHidden ? '' : ' hidden') + '" data-cw-for="' + esc(ev.id) + '">';
      html += '<div class="cw-bar-inner">';
      html += '<span class="cw-label">Content Warning</span>';
      html += '<span class="cw-desc">This entry documents graphic content depicting violence or injury.</span>';
      html += '<button class="cw-reveal" data-reveal="' + esc(ev.id) + '">Reveal</button>';
      html += '</div></div>';
    }

    html += '<div class="entry-content' + (isHidden ? ' hidden' : '') + '">';
    
    if (pageType === 'home' && ev.images && ev.images.length) {
      html += '<div style="display:flex; align-items:flex-start; gap: 1.5rem;">';
      var firstImg = ev.images[0];
      var src = depth + 'images/' + firstImg;
      var isVideo = src.match(/\.(mp4|webm|mov)$/i);
      html += '<div class="home-thumbnail" style="width: 80px; height: 80px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: rgba(0,0,0,0.1);">';
      if (isVideo) {
        html += '<video src="' + esc(src) + '" style="width:100%;height:100%;object-fit:cover;pointer-events:none;" autoplay muted loop playsinline></video>';
      } else {
        html += '<img src="' + esc(src) + '" style="width:100%;height:100%;object-fit:cover;" alt="Thumbnail" loading="lazy">';
      }
      html += '</div>';
      html += '<h3 class="entry-title" style="margin-top:0;">' + esc(ev.title) + '</h3>';
      html += '</div>';
    } else {
      html += '<h3 class="entry-title">' + esc(ev.title) + '</h3>';
    }
    
    if (pageType !== 'home') {
      html += '<p class="entry-body">' + esc(ev.description) + '</p>';
      
      if (ev.source_link || ev.source_url) {
        var link = ev.source_link || ev.source_url;
        var embedHtml = renderSocialEmbed(link, isDark);
        if (embedHtml) {
          html += embedHtml;
        } else {
          html += '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" class="entry-source-link">View original source &rarr;</a>';
        }
      }
      
      if (ev.ig_handle || ev.x_handle || ev.socials) {
        html += '<div class="social-handles">';
        if (ev.ig_handle) {
          var cleanIg = ev.ig_handle.startsWith('@') ? ev.ig_handle.substring(1) : ev.ig_handle;
          html += '<a href="https://instagram.com/' + esc(cleanIg) + '" target="_blank" rel="noopener noreferrer" class="social-handle ig-handle">IG: ' + esc(ev.ig_handle) + '</a>';
        }
        if (ev.x_handle) {
          var cleanX = ev.x_handle.startsWith('@') ? ev.x_handle.substring(1) : ev.x_handle;
          html += '<a href="https://x.com/' + esc(cleanX) + '" target="_blank" rel="noopener noreferrer" class="social-handle x-handle">X: ' + esc(ev.x_handle) + '</a>';
        }
        if (ev.socials && !ev.ig_handle && !ev.x_handle) {
          html += '<span class="social-handle">Socials: ' + esc(ev.socials) + '</span>';
        }
        html += '</div>';
      }
      
      if (ev.images && ev.images.length) {
        html += '<div class="entry-gallery' + (ev.images.length === 1 ? ' gallery-single' : (ev.images.length === 2 ? ' gallery-double' : ' gallery-multi')) + '">';
        ev.images.forEach(function(img, idx) {
          var src = depth + 'images/' + img;
          html += '<div class="gallery-thumb" data-event-id="' + ev.id + '" data-img-index="' + idx + '">';
          if (img.match(/\.(mp4|webm|mov)$/i)) {
            html += '<video src="' + src + '" style="width:100%;height:100%;object-fit:cover;pointer-events:none;" autoplay muted loop playsinline></video>';
          } else {
            html += '<img src="' + src + '" alt="Photo from ' + esc(ev.title) + '" loading="lazy">';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      
      if (ev.tags && ev.tags.length) {
        html += '<div class="entry-tags">' + ev.tags.map(function(t) { return '<button class="tag-btn" data-tag="' + esc(t) + '">#' + esc(t) + '</button>'; }).join(' ') + '</div>';
      }
      
      html += '<div class="entry-meta">';
      if (ev.verified) {
        html += '<span class="verified-stamp">Verified</span>';
      }
      html += '<span>Contributed by ' + esc(ev.contributor) + '</span>';
      
      html += '<button class="share-btn" data-share-id="' + esc(ev.id) + '" data-share-title="' + esc(ev.title) + '" data-share-cat="' + esc(ev.category) + '">';
      html += '<i data-lucide="share-2"></i> Share';
      html += '</button>';
      
      html += '</div>';
    }
    
    html += '</div></article>';
    return html;
  }

  exports.esc = esc;
  exports.renderSocialEmbed = renderSocialEmbed;
  exports.renderEventCard = renderEventCard;

})(typeof exports === 'undefined' ? (this.Template = {}) : exports);
