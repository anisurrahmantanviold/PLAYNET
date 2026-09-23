/**
 * PLYNET Profile Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetProfile = (function() {
  let activeProfileUserId = null;
  let activeTab = 'posts'; // 'posts' | 'media' | 'saved'

  function init() {
    // Tab switching inside profile
    document.querySelectorAll('.profile-nav-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.profile-nav-tab').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeTab = e.currentTarget.dataset.tab;
        renderProfileTabContent();
      });
    });
  }

  function openOwnProfile() {
    const user = window.PlynetAuth.getUser();
    if (user) {
      openUser(user.id);
    }
  }

  function openUserByHandle(handle) {
    const clean = handle.replace('@', '').toLowerCase();
    const db = window.PlynetFirebase.getDb();
    const user = Object.values(db.users).find(u => u.username.toLowerCase() === clean);
    if (user) {
      openUser(user.id);
    } else {
      window.PlynetApp.showToast(`User @${clean} not found`);
    }
  }

  function openUser(userId) {
    activeProfileUserId = userId;
    const db = window.PlynetFirebase.getDb();
    const currentUser = window.PlynetAuth.getUser();
    const user = (currentUser && userId === currentUser.id) ? currentUser : db.users[userId];

    if (!user) return;

    // Switch to profile screen view
    window.PlynetApp.switchScreen('profile');

    const isSelf = currentUser && currentUser.id === user.id;

    // Update profile DOM
    const coverEl = document.getElementById('profile-cover-img');
    if (coverEl) coverEl.src = user.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

    const avatarEl = document.getElementById('profile-main-avatar');
    if (avatarEl) avatarEl.src = user.avatar;

    const nameEl = document.getElementById('profile-name');
    if (nameEl) {
      nameEl.innerHTML = `${user.name} ${user.isVerified ? '<span class="verified-icon">✦</span>' : ''} ${user.isPremium ? '<span style="color:#F59E0B;font-size:0.85rem;">★ Premium</span>' : ''}`;
    }

    const handleEl = document.getElementById('profile-handle');
    if (handleEl) handleEl.textContent = `@${user.username}`;

    const bioEl = document.getElementById('profile-bio');
    if (bioEl) bioEl.textContent = user.bio || 'Living the connected life on PLYNET.';

    const followersEl = document.getElementById('profile-stat-followers');
    if (followersEl) followersEl.textContent = user.followers || 0;

    const followingEl = document.getElementById('profile-stat-following');
    if (followingEl) followingEl.textContent = user.following || 0;

    const postsCountEl = document.getElementById('profile-stat-posts');
    const userPosts = db.posts.filter(p => p.userId === user.id);
    if (postsCountEl) postsCountEl.textContent = userPosts.length;

    // Action buttons container
    const actionsContainer = document.getElementById('profile-action-buttons');
    if (actionsContainer) {
      if (isSelf) {
        actionsContainer.innerHTML = `
          <button class="btn-secondary" style="flex:1;" onclick="window.PlynetProfile.openEditProfileModal()">✏️ Edit Profile</button>
          <button class="btn-secondary" style="width:44px;padding:0;" onclick="window.PlynetApp.openScreen('settings')" aria-label="Settings">⚙️</button>
        `;
      } else {
        const isFollowing = user.isFollowing;
        actionsContainer.innerHTML = `
          <button class="btn-primary" style="flex:1;" id="btn-follow-user" onclick="window.PlynetProfile.toggleFollow('${user.id}')">
            ${isFollowing ? '✓ Following' : '+ Follow'}
          </button>
          <button class="btn-secondary" style="width:44px;padding:0;" onclick="window.PlynetMessaging.openChatWithUser('${user.id}')" aria-label="Message">💬</button>
          <button class="btn-secondary" style="width:44px;padding:0;color:var(--accent-emerald);" onclick="window.PlynetCalls.startCall('${user.id}', 'voice')" aria-label="Voice Call">📞</button>
          <button class="btn-secondary" style="width:44px;padding:0;color:var(--primary-500);" onclick="window.PlynetCalls.startCall('${user.id}', 'video')" aria-label="Video Call">🎥</button>
        `;
      }
    }

    renderProfileTabContent();
  }

  function renderProfileTabContent() {
    const listContainer = document.getElementById('profile-tab-content');
    if (!listContainer) return;

    const db = window.PlynetFirebase.getDb();
    let posts = db.posts.filter(p => p.userId === activeProfileUserId);

    if (activeTab === 'media') {
      posts = posts.filter(p => p.mediaType && p.mediaType !== 'none');
    } else if (activeTab === 'saved') {
      posts = db.posts.filter(p => p.isSaved);
    }

    if (posts.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="padding:40px 10px;">
          <div style="font-size:2.2rem;margin-bottom:8px;">${activeTab === 'saved' ? '🔖' : (activeTab === 'media' ? '🖼️' : '📝')}</div>
          <div style="font-size:0.95rem;font-weight:700;color:var(--text-secondary);">No ${activeTab} yet</div>
          <div style="font-size:0.8rem;color:var(--text-tertiary);">Activity will show up here.</div>
        </div>
      `;
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:12px;padding:12px;">';
    posts.forEach(post => {
      html += `
        <div class="post-card" style="box-shadow:none;border:1px solid var(--border-subtle);">
          <div style="padding:12px 14px;">
            <div style="font-size:0.75rem;color:var(--text-tertiary);margin-bottom:6px;">${post.timeAgo || 'Recent'}</div>
            <div style="font-size:0.92rem;color:var(--text-primary);">${window.PlynetPosts.formatRichText(post.text)}</div>
          </div>
          ${post.mediaUrl ? `<img src="${post.mediaUrl}" style="width:100%;max-height:260px;object-fit:cover;">` : ''}
          <div style="display:flex;gap:16px;padding:8px 14px;border-top:1px solid var(--border-subtle);font-size:0.8rem;color:var(--text-secondary);">
            <span>❤️ ${post.likesCount}</span>
            <span>💬 ${post.commentsCount}</span>
            <span>↗️ ${post.sharesCount}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    listContainer.innerHTML = html;
  }

  function toggleFollow(userId) {
    const db = window.PlynetFirebase.getDb();
    const user = db.users[userId];
    if (!user) return;

    user.isFollowing = !user.isFollowing;
    user.followers += user.isFollowing ? 1 : -1;
    if (user.followers < 0) user.followers = 0;
    window.PlynetFirebase.saveDb();

    if (user.isFollowing) {
      const currentUser = window.PlynetAuth.getUser();
      window.PlynetNotifications.addNotification({
        type: 'follow',
        actorName: currentUser ? currentUser.name : 'A member',
        actorAvatar: currentUser ? currentUser.avatar : '',
        text: 'started following you.'
      });
    }

    openUser(userId);
    window.PlynetApp.showToast(user.isFollowing ? `Following ${user.name}` : `Unfollowed ${user.name}`);
  }

  function openEditProfileModal() {
    const user = window.PlynetAuth.getUser();
    if (!user) return;

    const modalHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Full Name</label>
          <input type="text" id="edit-profile-name" class="input-field" value="${user.name}">
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Bio / Status</label>
          <textarea id="edit-profile-bio" class="input-field textarea-field" style="min-height:80px;">${user.bio || ''}</textarea>
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Profile Avatar URL</label>
          <input type="text" id="edit-profile-avatar" class="input-field" value="${user.avatar || ''}">
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Cover Banner URL</label>
          <input type="text" id="edit-profile-cover" class="input-field" value="${user.cover || ''}">
        </div>
        <button class="btn-primary" onclick="window.PlynetProfile.saveProfileChanges()">Save Changes</button>
      </div>
    `;

    window.PlynetApp.openCustomSheet('Edit Profile', modalHtml);
  }

  function saveProfileChanges() {
    const name = document.getElementById('edit-profile-name')?.value?.trim();
    const bio = document.getElementById('edit-profile-bio')?.value?.trim();
    const avatar = document.getElementById('edit-profile-avatar')?.value?.trim();
    const cover = document.getElementById('edit-profile-cover')?.value?.trim();

    if (!name) {
      window.PlynetApp.showToast('Please enter your name');
      return;
    }

    const updated = window.PlynetAuth.updateProfile({
      name,
      bio,
      avatar: avatar || undefined,
      cover: cover || undefined
    });

    window.PlynetApp.closeModal();
    window.PlynetApp.showToast('Profile updated successfully! ✨');
    openUser(updated.id);
  }

  return {
    init,
    openUser,
    openOwnProfile,
    openUserByHandle,
    toggleFollow,
    openEditProfileModal,
    saveProfileChanges
  };
})();
