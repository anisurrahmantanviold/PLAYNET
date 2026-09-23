/**
 * PLYNET Notifications Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetNotifications = (function() {
  function init() {
    renderNotifications();
  }

  function renderNotifications() {
    const list = document.getElementById('notifications-list');
    const badge = document.getElementById('header-unread-badge');
    if (!list) return;

    const db = window.PlynetFirebase.getDb();
    const notifs = db.notifications || [];

    const unreadCount = notifs.filter(n => n.unread).length;
    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    }

    if (notifs.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <div class="empty-title">You're all caught up!</div>
          <div class="empty-subtitle">New interactions and call notifications will appear here.</div>
        </div>
      `;
      return;
    }

    let html = '';
    notifs.forEach(n => {
      let icon = '🔔';
      if (n.type === 'like') icon = '❤️';
      if (n.type === 'comment') icon = '💬';
      if (n.type === 'follow') icon = '👥';
      if (n.type === 'call') icon = '📞';

      html += `
        <div class="chat-thread-item" style="background:${n.unread ? 'var(--badge-bg)' : 'transparent'};" onclick="window.PlynetNotifications.markAsRead('${n.id}')">
          <div style="position:relative;">
            <img src="${n.actorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}" style="width:42px;height:42px;border-radius:999px;object-fit:cover;">
            <div style="position:absolute;bottom:-2px;right:-2px;background:var(--bg-surface);border-radius:999px;padding:2px;font-size:0.8rem;">${icon}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:0.88rem;color:var(--text-primary);"><b style="font-weight:700;">${n.actorName}</b> ${n.text}</div>
            <div style="font-size:0.72rem;color:var(--text-tertiary);margin-top:2px;">${n.timeAgo || 'Just now'}</div>
          </div>
        </div>
      `;
    });

    list.innerHTML = html;
  }

  function addNotification({ type, actorName, actorAvatar, text }) {
    const db = window.PlynetFirebase.getDb();
    if (!db.notifications) db.notifications = [];

    const newNotif = {
      id: 'notif_' + Date.now(),
      type: type,
      actorName: actorName,
      actorAvatar: actorAvatar,
      text: text,
      timeAgo: 'Just now',
      unread: true,
      timestamp: Date.now()
    };

    db.notifications.unshift(newNotif);
    window.PlynetFirebase.saveDb();
    renderNotifications();

    if (window.PlynetNativeBridge && window.PlynetNativeBridge.vibrate) {
      window.PlynetNativeBridge.vibrate(30);
    }
  }

  function markAsRead(notifId) {
    const db = window.PlynetFirebase.getDb();
    const notif = (db.notifications || []).find(n => n.id === notifId);
    if (notif) {
      notif.unread = false;
      window.PlynetFirebase.saveDb();
      renderNotifications();
    }
  }

  function markAllRead() {
    const db = window.PlynetFirebase.getDb();
    (db.notifications || []).forEach(n => n.unread = false);
    window.PlynetFirebase.saveDb();
    renderNotifications();
    window.PlynetApp.showToast('All notifications marked as read');
  }

  return {
    init,
    renderNotifications,
    addNotification,
    markAsRead,
    markAllRead
  };
})();
