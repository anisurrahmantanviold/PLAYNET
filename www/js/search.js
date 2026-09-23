/**
 * PLYNET Search & Explore Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetSearch = (function() {
  const STORAGE_KEY_RECENT = 'plynet_recent_searches';
  let recentSearches = ['#design', '#tech', 'Elena', 'webrtc'];
  let currentSearchTab = 'all'; // 'all' | 'people' | 'posts' | 'communities' | 'tags'
  let currentQuery = '';

  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENT);
      if (stored) recentSearches = JSON.parse(stored);
    } catch (e) {}

    const searchInput = document.getElementById('search-input-field');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentQuery = e.target.value.trim().toLowerCase();
        executeSearch();
      });
    }

    // Search tabs
    document.querySelectorAll('.search-nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.search-nav-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentSearchTab = e.currentTarget.dataset.tab;
        executeSearch();
      });
    });

    renderRecentAndTrending();
  }

  function renderRecentAndTrending() {
    const recentContainer = document.getElementById('search-recent-chips');
    if (recentContainer) {
      if (recentSearches.length === 0) {
        recentContainer.innerHTML = '<span style="font-size:0.8rem;color:var(--text-tertiary);">No recent searches</span>';
      } else {
        recentContainer.innerHTML = recentSearches.map(term => `
          <div class="ai-chip-btn" onclick="window.PlynetSearch.applySearchTerm('${term}')">
            <span>${term}</span>
            <span style="opacity:0.6;font-size:0.7rem;margin-left:4px;" onclick="event.stopPropagation(); window.PlynetSearch.removeRecent('${term}')">✕</span>
          </div>
        `).join('');
      }
    }
  }

  function applySearchTerm(term) {
    const input = document.getElementById('search-input-field');
    if (input) {
      input.value = term;
      currentQuery = term.toLowerCase();
      executeSearch();
    }
  }

  function searchTag(tag) {
    window.PlynetApp.switchScreen('search');
    applySearchTerm('#' + tag);
  }

  function removeRecent(term) {
    recentSearches = recentSearches.filter(t => t !== term);
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentSearches));
    renderRecentAndTrending();
  }

  function clearAllRecent() {
    recentSearches = [];
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentSearches));
    renderRecentAndTrending();
  }

  function executeSearch() {
    const resultsContainer = document.getElementById('search-results-container');
    const recentTrendingSection = document.getElementById('search-recent-section');

    if (!currentQuery) {
      if (recentTrendingSection) recentTrendingSection.style.display = 'block';
      if (resultsContainer) resultsContainer.innerHTML = '';
      return;
    }

    if (recentTrendingSection) recentTrendingSection.style.display = 'none';

    // Save to recent searches if new
    if (!recentSearches.includes(currentQuery) && currentQuery.length > 2) {
      recentSearches.unshift(currentQuery);
      if (recentSearches.length > 8) recentSearches.pop();
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentSearches));
      renderRecentAndTrending();
    }

    const db = window.PlynetFirebase.getDb();
    let html = '';

    // Search Users
    if (currentSearchTab === 'all' || currentSearchTab === 'people') {
      const matchedUsers = Object.values(db.users).filter(u => 
        u.name.toLowerCase().includes(currentQuery) || 
        u.username.toLowerCase().includes(currentQuery) || 
        (u.bio && u.bio.toLowerCase().includes(currentQuery))
      );

      if (matchedUsers.length > 0) {
        html += '<div style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin:10px 0 6px 0;">PEOPLE</div>';
        matchedUsers.forEach(u => {
          html += `
            <div class="chat-thread-item" onclick="window.PlynetProfile.openUser('${u.id}')">
              <img src="${u.avatar}" style="width:40px;height:40px;border-radius:999px;object-fit:cover;">
              <div style="flex:1;">
                <div style="font-weight:700;font-size:0.92rem;color:var(--text-primary);">${u.name} ${u.isVerified ? '✦' : ''}</div>
                <div style="font-size:0.75rem;color:var(--text-tertiary);">@${u.username} • ${(u.followers || 0).toLocaleString()} followers</div>
              </div>
              <button class="btn-secondary" style="width:auto;padding:6px 14px;border-radius:999px;font-size:0.78rem;">View</button>
            </div>
          `;
        });
      }
    }

    // Search Communities
    if (currentSearchTab === 'all' || currentSearchTab === 'communities') {
      const matchedComms = (db.communities || []).filter(c => 
        c.name.toLowerCase().includes(currentQuery) || 
        c.handle.toLowerCase().includes(currentQuery) || 
        c.description.toLowerCase().includes(currentQuery)
      );

      if (matchedComms.length > 0) {
        html += '<div style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin:14px 0 6px 0;">COMMUNITIES</div>';
        matchedComms.forEach(c => {
          html += `
            <div class="chat-thread-item" onclick="window.PlynetCommunities.openCommunity('${c.id}')">
              <img src="${c.avatar}" style="width:40px;height:40px;border-radius:var(--radius-sm);object-fit:cover;">
              <div style="flex:1;">
                <div style="font-weight:700;font-size:0.92rem;color:var(--text-primary);">${c.name}</div>
                <div style="font-size:0.75rem;color:var(--text-tertiary);">@${c.handle} • ${(c.membersCount || 0).toLocaleString()} members</div>
              </div>
              <button class="btn-primary" style="width:auto;padding:6px 14px;border-radius:999px;font-size:0.78rem;">Join</button>
            </div>
          `;
        });
      }
    }

    // Search Posts
    if (currentSearchTab === 'all' || currentSearchTab === 'posts' || currentSearchTab === 'tags') {
      const matchedPosts = db.posts.filter(p => 
        p.text.toLowerCase().includes(currentQuery) || 
        p.userName.toLowerCase().includes(currentQuery)
      );

      if (matchedPosts.length > 0) {
        html += '<div style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin:14px 0 6px 0;">POSTS & HASHTAGS</div>';
        matchedPosts.forEach(p => {
          html += `
            <div class="post-card" style="margin-bottom:10px;box-shadow:none;border:1px solid var(--border-subtle);cursor:pointer;" onclick="window.PlynetFeed.renderFeed(); window.PlynetApp.switchScreen('feed');">
              <div style="padding:10px 12px;font-size:0.88rem;">${window.PlynetPosts.formatRichText(p.text)}</div>
              <div style="padding:4px 12px 8px 12px;font-size:0.72rem;color:var(--text-tertiary);display:flex;justify-content:space-between;">
                <span>By ${p.userName}</span>
                <span>❤️ ${p.likesCount} • 💬 ${p.commentsCount}</span>
              </div>
            </div>
          `;
        });
      }
    }

    if (!html) {
      html = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No results found for "${currentQuery}"</div>
          <div class="empty-subtitle">Try searching for keywords like "design", "tech", "webrtc", or user handles.</div>
        </div>
      `;
    }

    resultsContainer.innerHTML = html;
  }

  return {
    init,
    applySearchTerm,
    searchTag,
    removeRecent,
    clearAllRecent
  };
})();
