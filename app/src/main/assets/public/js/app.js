/**
 * PLYNET Main Application Controller
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetApp = (function() {
  let activeScreen = 'feed';
  let activePrivacy = 'public';
  let selectedMediaDataUrl = '';
  let selectedMediaType = 'none';

  function init() {
    // Initialize services
    window.PlynetFirebase.init();
    window.PlynetAuth.init();
    window.PlynetSettings.init();
    window.PlynetFeed.init();
    window.PlynetMessaging.init();
    window.PlynetCommunities.init();
    window.PlynetSearch.init();
    window.PlynetNotifications.init();
    window.PlynetCalls.init();
    window.PlynetProfile.init();

    setupBottomNav();
    setupTopBar();
    setupNetworkMonitor();

    // Modal background click to close
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    console.log('PLYNET Social Network initialized successfully.');
  }

  function setupBottomNav() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.screen;
        if (target === 'create') {
          openCreatePost();
        } else if (target === 'profile') {
          window.PlynetProfile.openOwnProfile();
        } else {
          switchScreen(target);
        }
      });
    });
  }

  function setupTopBar() {
    const aiBtn = document.getElementById('top-ai-btn');
    if (aiBtn) aiBtn.addEventListener('click', () => window.PlynetAI.openAIPanel());

    const notifBtn = document.getElementById('top-notif-btn');
    if (notifBtn) notifBtn.addEventListener('click', () => switchScreen('notifications'));

    const brandLogo = document.getElementById('brand-logo-btn');
    if (brandLogo) brandLogo.addEventListener('click', () => switchScreen('feed'));
  }

  function switchScreen(screenName) {
    activeScreen = screenName;

    // Update screen views
    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetEl = document.getElementById(`screen-${screenName}`);
    if (targetEl) targetEl.classList.add('active');

    // Update bottom nav active state
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screenName);
    });

    // Specific screen re-renders
    if (screenName === 'feed') window.PlynetFeed.renderFeed();
    if (screenName === 'messages') window.PlynetMessaging.renderConversationsList();
    if (screenName === 'communities') window.PlynetCommunities.renderCommunitiesList();
    if (screenName === 'notifications') window.PlynetNotifications.renderNotifications();
  }

  // Create Post Modal
  function openCreatePost(preselectedCommunityId = null) {
    selectedMediaDataUrl = '';
    selectedMediaType = 'none';
    activePrivacy = 'public';

    const user = window.PlynetAuth.getUser();
    if (!user) {
      showToast('Please log in to create a post');
      return;
    }

    const modalHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${user.avatar}" style="width:40px;height:40px;border-radius:999px;object-fit:cover;">
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">${user.name}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-top:2px;">
              <select id="create-post-privacy" class="input-field" style="padding:2px 8px;font-size:0.75rem;border-radius:999px;width:auto;">
                <option value="public">🌍 Public</option>
                <option value="followers">👥 Followers Only</option>
                <option value="only_me">🔒 Only Me</option>
              </select>
            </div>
          </div>
        </div>

        <textarea id="create-post-text" class="input-field textarea-field" placeholder="What is happening in your network? Connect. Share. Belong..." style="min-height:110px;font-size:1rem;"></textarea>

        <div id="media-preview-box" style="display:none;position:relative;border-radius:var(--radius-md);overflow:hidden;max-height:220px;">
          <img id="media-preview-img" style="width:100%;height:auto;object-fit:cover;display:none;">
          <video id="media-preview-vid" controls style="width:100%;display:none;"></video>
          <button style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:999px;width:28px;height:28px;cursor:pointer;" onclick="window.PlynetApp.clearPostMedia()">✕</button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border-subtle);">
          <div style="display:flex;gap:8px;">
            <label class="icon-btn" style="cursor:pointer;" title="Add Photo">
              📷
              <input type="file" id="post-media-input" accept="image/*,video/*" style="display:none;" onchange="window.PlynetApp.handleMediaSelect(event)">
            </label>
            <button class="icon-btn ai-sparkle-btn" onclick="window.PlynetAI.generatePostCaption()" title="AI Caption with Gemini">
              ✨
            </button>
            <button class="icon-btn" onclick="window.PlynetAI.rewritePostTone('inspiring')" title="Polish Post">
              💡
            </button>
          </div>

          <button class="btn-primary" style="width:auto;padding:8px 24px;" onclick="window.PlynetApp.submitPost('${preselectedCommunityId || ''}')">
            Post
          </button>
        </div>
      </div>
    `;

    openCustomSheet('Create Post', modalHtml);
  }

  function handleMediaSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    selectedMediaType = isVideo ? 'video' : 'image';

    const reader = new FileReader();
    reader.onload = function(evt) {
      selectedMediaDataUrl = evt.target.result;
      const box = document.getElementById('media-preview-box');
      const img = document.getElementById('media-preview-img');
      const vid = document.getElementById('media-preview-vid');

      if (box) box.style.display = 'block';
      if (isVideo && vid) {
        vid.src = selectedMediaDataUrl;
        vid.style.display = 'block';
        if (img) img.style.display = 'none';
      } else if (img) {
        img.src = selectedMediaDataUrl;
        img.style.display = 'block';
        if (vid) vid.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  }

  function clearPostMedia() {
    selectedMediaDataUrl = '';
    selectedMediaType = 'none';
    const box = document.getElementById('media-preview-box');
    if (box) box.style.display = 'none';
  }

  async function submitPost(communityId = null) {
    const textEl = document.getElementById('create-post-text');
    const privacyEl = document.getElementById('create-post-privacy');
    const text = textEl ? textEl.value.trim() : '';
    const privacy = privacyEl ? privacyEl.value : 'public';

    if (!text && !selectedMediaDataUrl) {
      showToast('Please type a message or choose a photo/video');
      return;
    }

    try {
      await window.PlynetPosts.createPost({
        text: text,
        mediaUrl: selectedMediaDataUrl,
        mediaType: selectedMediaType,
        privacy: privacy,
        communityId: communityId || null
      });

      closeModal();
      showToast('Post published to PLYNET! 🚀');
      switchScreen('feed');
    } catch (err) {
      showToast(err.message || 'Failed to publish post');
    }
  }

  // Generic Bottom Sheet / Modal Controller
  function openCustomSheet(title, htmlContent) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('sheet-title');
    const bodyEl = document.getElementById('sheet-body');

    if (!overlay || !bodyEl) return;
    if (titleEl) titleEl.textContent = title;
    bodyEl.innerHTML = htmlContent;
    overlay.classList.add('active');
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  // Toast notifications
  function showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Network monitor for offline status
  function setupNetworkMonitor() {
    const banner = document.getElementById('offline-banner');
    function updateOnlineStatus() {
      if (!navigator.onLine) {
        if (banner) banner.style.display = 'block';
        showToast('You are offline. Showing cached PLYNET data.');
      } else {
        if (banner) banner.style.display = 'none';
      }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  return {
    init,
    switchScreen,
    openScreen: switchScreen,
    openCreatePost,
    handleMediaSelect,
    clearPostMedia,
    submitPost,
    openCustomSheet,
    closeModal,
    showToast
  };
})();

// Boot app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.PlynetApp.init();
});
