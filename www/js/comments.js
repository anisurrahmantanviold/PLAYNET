/**
 * PLYNET Comments Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetComments = (function() {
  const STORAGE_KEY_COMMENTS = 'plynet_comments_store';
  let commentsMap = {};
  let activePostId = null;

  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMENTS);
      if (stored) {
        commentsMap = JSON.parse(stored);
      } else {
        seedInitialComments();
      }
    } catch (e) {
      seedInitialComments();
    }
  }

  function saveComments() {
    try {
      localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(commentsMap));
    } catch (e) {}
  }

  function seedInitialComments() {
    commentsMap = {
      'post_1': [
        {
          id: 'c1',
          userId: 'user_2',
          userName: 'Marcus Chen',
          userHandle: 'marcus_ai',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          text: 'The gradient depth on the cards looks incredible! Great attention to mobile touch ergonomics.',
          timestamp: Date.now() - 10 * 60 * 1000,
          timeAgo: '10m ago',
          likesCount: 5,
          isLiked: false
        },
        {
          id: 'c2',
          userId: 'user_3',
          userName: 'Sophia Williams',
          userHandle: 'sophia_travel',
          userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          text: 'Love this so much! The typography contrast makes reading long threads effortless ✨',
          timestamp: Date.now() - 5 * 60 * 1000,
          timeAgo: '5m ago',
          likesCount: 2,
          isLiked: false
        }
      ]
    };
    saveComments();
  }

  function openComments(postId) {
    activePostId = postId;
    const db = window.PlynetFirebase.getDb();
    const post = db.posts.find(p => p.id === postId);
    if (!post) return;

    renderCommentsSheet(post);
  }

  function renderCommentsSheet(post) {
    const list = commentsMap[post.id] || [];
    const currentUser = window.PlynetAuth.getUser();

    let commentsHtml = '';
    if (list.length === 0) {
      commentsHtml = `
        <div class="empty-state" style="padding: 24px 10px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">💬</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary);">No comments yet</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary);">Be the first one to start the conversation!</div>
        </div>
      `;
    } else {
      commentsHtml = list.map(c => {
        const isOwner = currentUser && c.userId === currentUser.id;
        return `
          <div class="comment-item" style="display:flex;gap:10px;margin-bottom:14px;" id="comm_${c.id}">
            <img src="${c.userAvatar}" style="width:34px;height:34px;border-radius:999px;object-fit:cover;" alt="${c.userName}">
            <div style="flex:1;">
              <div style="background:var(--bg-surface-subtle);padding:8px 12px;border-radius:var(--radius-md);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                  <span style="font-size:0.84rem;font-weight:700;color:var(--text-primary);">${c.userName}</span>
                  <span style="font-size:0.7rem;color:var(--text-tertiary);">${c.timeAgo || 'Now'}</span>
                </div>
                <div style="font-size:0.88rem;color:var(--text-primary);">${window.PlynetPosts.formatRichText(c.text)}</div>
              </div>
              <div style="display:flex;gap:14px;margin-top:4px;padding-left:4px;font-size:0.75rem;color:var(--text-tertiary);">
                <span style="cursor:pointer;font-weight:600;" onclick="window.PlynetComments.toggleLikeComment('${post.id}', '${c.id}')">
                  ${c.isLiked ? '❤️ Liked' : '🤍 Like'} (${c.likesCount || 0})
                </span>
                <span style="cursor:pointer;font-weight:600;" onclick="window.PlynetComments.replyToUser('${c.userHandle}')">Reply</span>
                ${isOwner ? `<span style="cursor:pointer;color:var(--accent-pink);" onclick="window.PlynetComments.deleteComment('${post.id}', '${c.id}')">Delete</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const contentHtml = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div style="flex:1;overflow-y:auto;max-height:360px;padding-bottom:10px;" id="comments-list-container">
          ${commentsHtml}
        </div>
        <div style="display:flex;gap:8px;padding-top:12px;border-top:1px solid var(--border-subtle);">
          <input type="text" id="comment-input-field" class="input-field" placeholder="Add a thoughtful comment..." style="border-radius:999px;padding:10px 16px;">
          <button class="btn-primary" style="width:auto;border-radius:999px;padding:0 18px;" onclick="window.PlynetComments.submitComment('${post.id}')">Post</button>
        </div>
      </div>
    `;

    window.PlynetApp.openCustomSheet(`Comments (${post.commentsCount})`, contentHtml);

    setTimeout(() => {
      const input = document.getElementById('comment-input-field');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') window.PlynetComments.submitComment(post.id);
        });
      }
    }, 100);
  }

  function submitComment(postId) {
    const input = document.getElementById('comment-input-field');
    if (!input || !input.value.trim()) return;

    const user = window.PlynetAuth.getUser();
    if (!user) {
      window.PlynetApp.showToast('Please log in to comment');
      return;
    }

    const text = input.value.trim();
    if (!commentsMap[postId]) commentsMap[postId] = [];

    const newComment = {
      id: 'c_' + Date.now(),
      userId: user.id,
      userName: user.name,
      userHandle: user.username,
      userAvatar: user.avatar,
      text: text,
      timestamp: Date.now(),
      timeAgo: 'Just now',
      likesCount: 0,
      isLiked: false
    };

    commentsMap[postId].push(newComment);
    saveComments();

    // Increment post comment count
    const db = window.PlynetFirebase.getDb();
    const post = db.posts.find(p => p.id === postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      window.PlynetFirebase.saveDb();
    }

    // Add notification to post author if not self
    if (post && post.userId !== user.id) {
      window.PlynetNotifications.addNotification({
        type: 'comment',
        actorName: user.name,
        actorAvatar: user.avatar,
        text: `commented: "${text.substring(0, 35)}..."`
      });
    }

    input.value = '';
    renderCommentsSheet(post);
    window.PlynetFeed.renderFeed();
  }

  function replyToUser(handle) {
    const input = document.getElementById('comment-input-field');
    if (input) {
      input.value = `@${handle} ` + input.value;
      input.focus();
    }
  }

  function toggleLikeComment(postId, commentId) {
    const list = commentsMap[postId];
    if (!list) return;
    const c = list.find(x => x.id === commentId);
    if (!c) return;

    c.isLiked = !c.isLiked;
    c.likesCount = (c.likesCount || 0) + (c.isLiked ? 1 : -1);
    if (c.likesCount < 0) c.likesCount = 0;
    saveComments();

    const db = window.PlynetFirebase.getDb();
    const post = db.posts.find(p => p.id === postId);
    if (post) renderCommentsSheet(post);
  }

  function deleteComment(postId, commentId) {
    const list = commentsMap[postId];
    if (!list) return;
    const idx = list.findIndex(x => x.id === commentId);
    if (idx !== -1) {
      list.splice(idx, 1);
      saveComments();

      const db = window.PlynetFirebase.getDb();
      const post = db.posts.find(p => p.id === postId);
      if (post) {
        post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
        window.PlynetFirebase.saveDb();
        renderCommentsSheet(post);
        window.PlynetFeed.renderFeed();
      }
    }
  }

  return {
    init,
    openComments,
    submitComment,
    replyToUser,
    toggleLikeComment,
    deleteComment
  };
})();
