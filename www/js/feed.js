/**
 * PLYNET Feed Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetFeed = (function() {
  let currentTab = 'for_you'; // 'for_you' | 'following' | 'communities'
  let feedContainer = null;
  let storiesContainer = null;

  function init() {
    feedContainer = document.getElementById('feed-stream');
    storiesContainer = document.getElementById('stories-container');

    // Tab buttons
    document.querySelectorAll('.feed-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        document.querySelectorAll('.feed-tab').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentTab = e.currentTarget.dataset.tab;
        renderFeed();
      });
    });

    // Listen to post creation/deletion
    window.addEventListener('plynet:postCreated', () => renderFeed());
    window.addEventListener('plynet:postDeleted', () => renderFeed());

    renderStories();
    renderFeed();
  }

  function renderStories() {
    if (!storiesContainer) return;
    const db = window.PlynetFirebase.getDb();
    const currentUser = window.PlynetAuth.getUser();

    let html = `
      <div class="story-item" onclick="window.PlynetApp.openCreatePost()">
        <div class="story-avatar-wrap add-story">
          <img src="${currentUser ? currentUser.avatar : ''}" class="story-avatar" alt="My Story">
          <div style="position:absolute;bottom:0;right:0;background:var(--primary-500);color:#fff;border-radius:999px;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid var(--bg-surface)">+</div>
        </div>
        <span class="story-label">Your Story</span>
      </div>
    `;

    Object.values(db.users).forEach(u => {
      if (currentUser && u.id === currentUser.id) return;
      html += `
        <div class="story-item" onclick="window.PlynetFeed.viewStory('${u.id}')">
          <div class="story-avatar-wrap">
            <img src="${u.avatar}" class="story-avatar" alt="${u.name}">
          </div>
          <span class="story-label">${u.name.split(' ')[0]}</span>
        </div>
      `;
    });

    storiesContainer.innerHTML = html;
  }

  function viewStory(userId) {
    const db = window.PlynetFirebase.getDb();
    const user = db.users[userId];
    if (!user) return;
    window.PlynetApp.showToast(`Viewing story from ${user.name}... ✨`);
  }

  function renderFeed() {
    if (!feedContainer) return;
    const db = window.PlynetFirebase.getDb();
    let posts = [...db.posts];

    // Filter by tab
    if (currentTab === 'following') {
      posts = posts.filter(p => p.isLiked || p.userName === 'Elena Rostova');
    } else if (currentTab === 'communities') {
      posts = posts.filter(p => p.communityId || p.text.includes('#community') || p.text.includes('#tech'));
    }

    if (posts.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-title">No posts here yet</div>
          <div class="empty-subtitle">Connect with more people or create your first post to get things moving!</div>
          <button class="btn-primary" style="margin-top:16px;width:auto;padding:8px 20px;" onclick="window.PlynetApp.openCreatePost()">Create Post</button>
        </div>
      `;
      return;
    }

    let html = '';
    posts.forEach((post, index) => {
      // Check for Ad insertion (every 4 posts)
      if (index > 0 && index % 4 === 0 && window.PlynetAds && window.PlynetAds.shouldShowFeedAd()) {
        html += window.PlynetAds.renderFeedAdCard();
      }

      const formattedBody = window.PlynetPosts.formatRichText(post.text);
      const isLikedClass = post.isLiked ? 'liked' : '';
      const isSavedClass = post.isSaved ? 'saved' : '';

      let mediaHtml = '';
      if (post.mediaType === 'image' && post.mediaUrl) {
        mediaHtml = `
          <div class="post-media-container">
            <img src="${post.mediaUrl}" class="post-media-img" loading="lazy" alt="Post Media">
          </div>
        `;
      } else if (post.mediaType === 'video' && post.mediaUrl) {
        mediaHtml = `
          <div class="post-media-container">
            <video src="${post.mediaUrl}" class="post-media-video" controls playsinline></video>
          </div>
        `;
      }

      html += `
        <article class="post-card" id="card_${post.id}">
          <div class="post-header">
            <div class="post-author-info" onclick="window.PlynetProfile.openUser('${post.userId}')">
              <img src="${post.userAvatar}" class="author-avatar" alt="${post.userName}">
              <div class="author-names">
                <div class="author-display-name">
                  ${post.userName}
                  ${post.userVerified ? '<span class="verified-icon">✦</span>' : ''}
                </div>
                <div class="author-handle-row">
                  <span>@${post.userHandle}</span>
                  <span>•</span>
                  <span>${post.timeAgo || 'Recent'}</span>
                </div>
              </div>
            </div>
            <button class="icon-btn" style="width:32px;height:32px;background:transparent;" onclick="window.PlynetFeed.openPostMenu('${post.id}')" aria-label="More options">
              •••
            </button>
          </div>

          <div class="post-content-body">
            ${formattedBody}
          </div>

          ${mediaHtml}

          <div class="post-actions-bar">
            <div class="action-btn-group">
              <button class="post-action-btn ${isLikedClass}" onclick="window.PlynetFeed.handleLike('${post.id}')" aria-label="Like">
                <span>${post.isLiked ? '❤️' : '🤍'}</span>
                <span class="like-count">${post.likesCount}</span>
              </button>

              <button class="post-action-btn" onclick="window.PlynetComments.openComments('${post.id}')" aria-label="Comments">
                <span>💬</span>
                <span>${post.commentsCount}</span>
              </button>

              <button class="post-action-btn" onclick="window.PlynetFeed.handleShare('${post.id}')" aria-label="Share">
                <span>↗️</span>
                <span>${post.sharesCount}</span>
              </button>
            </div>

            <button class="post-action-btn ${isSavedClass}" onclick="window.PlynetFeed.handleSave('${post.id}')" aria-label="Save">
              <span>${post.isSaved ? '🔖' : '🏷️'}</span>
            </button>
          </div>
        </article>
      `;
    });

    feedContainer.innerHTML = html;
  }

  async function handleLike(postId) {
    const post = await window.PlynetPosts.toggleLike(postId);
    if (!post) return;
    const card = document.getElementById(`card_${postId}`);
    if (card) {
      const btn = card.querySelector('.post-action-btn');
      if (btn) {
        btn.classList.toggle('liked', post.isLiked);
        btn.innerHTML = `<span>${post.isLiked ? '❤️' : '🤍'}</span><span class="like-count">${post.likesCount}</span>`;
      }
    }
  }

  async function handleSave(postId) {
    const post = await window.PlynetPosts.toggleSave(postId);
    if (!post) return;
    window.PlynetApp.showToast(post.isSaved ? 'Saved to bookmarks 🔖' : 'Removed from bookmarks');
    renderFeed();
  }

  async function handleShare(postId) {
    const db = window.PlynetFirebase.getDb();
    const post = db.posts.find(p => p.id === postId);
    if (post) {
      await window.PlynetPosts.sharePost(post);
    }
  }

  function openPostMenu(postId) {
    const db = window.PlynetFirebase.getDb();
    const post = db.posts.find(p => p.id === postId);
    const currentUser = window.PlynetAuth.getUser();
    if (!post) return;

    const isOwner = currentUser && post.userId === currentUser.id;
    let actionsHtml = `
      <div style="display:flex;flex-direction:column;gap:8px;padding:8px 0;">
        <button class="btn-secondary" onclick="window.PlynetFeed.handleShare('${post.id}');window.PlynetApp.closeModal();">↗️ Share Post</button>
        <button class="btn-secondary" onclick="window.PlynetFeed.handleSave('${post.id}');window.PlynetApp.closeModal();">🔖 Bookmark</button>
        <button class="btn-secondary" onclick="window.PlynetPosts.reportPost('${post.id}');window.PlynetApp.closeModal();">⚠️ Report</button>
        ${isOwner ? `<button class="btn-secondary" style="color:var(--accent-pink);border-color:var(--accent-pink);" onclick="window.PlynetPosts.deletePost('${post.id}');window.PlynetApp.closeModal();">🗑️ Delete Post</button>` : ''}
      </div>
    `;

    window.PlynetApp.openCustomSheet('Post Options', actionsHtml);
  }

  return {
    init,
    renderFeed,
    renderStories,
    viewStory,
    handleLike,
    handleSave,
    handleShare,
    openPostMenu
  };
})();
