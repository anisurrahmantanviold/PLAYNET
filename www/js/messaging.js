/**
 * PLYNET Real-time Messaging
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetMessaging = (function() {
  let activeChatId = null;
  let activePartner = null;
  let isRecordingVoice = false;
  let voiceRecordTimer = null;
  let voiceRecordDuration = 0;

  function init() {
    renderConversationsList();
  }

  function renderConversationsList() {
    const listContainer = document.getElementById('chats-threads-list');
    if (!listContainer) return;

    const db = window.PlynetFirebase.getDb();
    const chats = Object.values(db.chats || {});

    if (chats.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-title">No conversations yet</div>
          <div class="empty-subtitle">Start chatting with creators and community members!</div>
        </div>
      `;
      return;
    }

    let html = '';
    chats.forEach(chat => {
      const partner = db.users[chat.partnerId] || {
        name: 'Member',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };

      const unreadBadge = chat.unreadCount > 0 ? `<div class="badge" style="position:static;margin-left:8px;">${chat.unreadCount}</div>` : '';

      html += `
        <div class="chat-thread-item" onclick="window.PlynetMessaging.openChatWithUser('${chat.partnerId}')">
          <div class="chat-avatar-wrap">
            <img src="${partner.avatar}" style="width:100%;height:100%;border-radius:999px;object-fit:cover;" alt="${partner.name}">
            <div class="online-dot"></div>
          </div>
          <div class="chat-info">
            <div class="chat-name-row">
              <span class="chat-user-name">${partner.name}</span>
              <span class="chat-time">10m ago</span>
            </div>
            <div class="chat-preview-row">
              <span class="chat-last-msg">${chat.lastMessage || 'Say hello...'}</span>
              ${unreadBadge}
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  function openChatWithUser(partnerId) {
    const db = window.PlynetFirebase.getDb();
    const partner = db.users[partnerId];
    if (!partner) return;

    activePartner = partner;
    activeChatId = `chat_${partnerId}`;

    if (!db.chats[activeChatId]) {
      db.chats[activeChatId] = {
        id: activeChatId,
        partnerId: partnerId,
        lastMessage: 'Started new conversation',
        timestamp: Date.now(),
        unreadCount: 0
      };
      db.messages[activeChatId] = [];
      window.PlynetFirebase.saveDb();
    } else {
      db.chats[activeChatId].unreadCount = 0;
      window.PlynetFirebase.saveDb();
    }

    // Update Chat Room DOM
    const roomHeaderAvatar = document.getElementById('chat-room-avatar');
    if (roomHeaderAvatar) roomHeaderAvatar.src = partner.avatar;

    const roomHeaderName = document.getElementById('chat-room-name');
    if (roomHeaderName) roomHeaderName.textContent = partner.name;

    const voiceCallBtn = document.getElementById('chat-room-voice-call');
    if (voiceCallBtn) {
      voiceCallBtn.onclick = () => window.PlynetCalls.startCall(partner.id, 'voice');
    }

    const videoCallBtn = document.getElementById('chat-room-video-call');
    if (videoCallBtn) {
      videoCallBtn.onclick = () => window.PlynetCalls.startCall(partner.id, 'video');
    }

    window.PlynetApp.switchScreen('chat_room');
    renderMessages();
  }

  function renderMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container || !activeChatId) return;

    const db = window.PlynetFirebase.getDb();
    const msgs = db.messages[activeChatId] || [];
    const currentUser = window.PlynetAuth.getUser();

    let html = '';
    msgs.forEach(m => {
      const isSent = !currentUser || m.senderId === currentUser.id || m.senderId === 'current_user';
      const bubbleClass = isSent ? 'sent' : 'received';

      let contentHtml = '';
      if (m.type === 'voice') {
        contentHtml = `
          <div style="display:flex;align-items:center;gap:8px;min-width:140px;">
            <span style="font-size:1.2rem;">▶️</span>
            <div class="voice-wave-preview" style="flex:1;">
              <div class="wave-bar" style="height:8px;"></div>
              <div class="wave-bar" style="height:16px;"></div>
              <div class="wave-bar" style="height:12px;"></div>
              <div class="wave-bar" style="height:20px;"></div>
              <div class="wave-bar" style="height:6px;"></div>
            </div>
            <span style="font-size:0.72rem;">0:08</span>
          </div>
        `;
      } else if (m.mediaUrl) {
        contentHtml = `<img src="${m.mediaUrl}" style="max-width:200px;border-radius:10px;margin-bottom:4px;display:block;">${m.text || ''}`;
      } else {
        contentHtml = m.text;
      }

      html += `
        <div class="msg-bubble ${bubbleClass}" onclick="window.PlynetMessaging.showMsgOptions('${m.id}', '${m.text ? m.text.replace(/'/g, "\\'") : ''}')">
          ${contentHtml}
          <div class="msg-meta">
            <span>Just now</span>
            ${isSent ? '<span>✓✓</span>' : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function sendMessage() {
    const input = document.getElementById('chat-text-input');
    if (!input || !input.value.trim() || !activeChatId) return;

    const text = input.value.trim();
    const currentUser = window.PlynetAuth.getUser();
    const db = window.PlynetFirebase.getDb();

    if (!db.messages[activeChatId]) db.messages[activeChatId] = [];

    const newMsg = {
      id: 'm_' + Date.now(),
      senderId: currentUser ? currentUser.id : 'current_user',
      text: text,
      timestamp: Date.now(),
      status: 'sent'
    };

    db.messages[activeChatId].push(newMsg);
    if (db.chats[activeChatId]) {
      db.chats[activeChatId].lastMessage = text;
      db.chats[activeChatId].timestamp = Date.now();
    }
    window.PlynetFirebase.saveDb();

    input.value = '';
    renderMessages();

    // Haptic feedback
    if (window.PlynetNativeBridge && window.PlynetNativeBridge.vibrate) {
      window.PlynetNativeBridge.vibrate(15);
    }

    // Auto reply simulation if talking to Marcus or Elena
    simulatePartnerReply(text);
  }

  function simulatePartnerReply(userText) {
    if (!activePartner) return;
    const partner = activePartner;
    const typingIndicator = document.getElementById('chat-typing-indicator');

    setTimeout(() => {
      if (typingIndicator) typingIndicator.style.display = 'block';
      setTimeout(() => {
        if (typingIndicator) typingIndicator.style.display = 'none';

        let reply = `That sounds awesome! Love how fast and smooth PLYNET feels! 🚀`;
        if (userText.toLowerCase().includes('call') || userText.toLowerCase().includes('video')) {
          reply = `I can jump on a WebRTC video call whenever you are ready! Tap the camera button on top 🎥📞`;
        }

        const db = window.PlynetFirebase.getDb();
        if (db.messages[activeChatId]) {
          db.messages[activeChatId].push({
            id: 'm_' + Date.now(),
            senderId: partner.id,
            text: reply,
            timestamp: Date.now(),
            status: 'received'
          });
          if (db.chats[activeChatId]) {
            db.chats[activeChatId].lastMessage = reply;
            db.chats[activeChatId].timestamp = Date.now();
          }
          window.PlynetFirebase.saveDb();
          renderMessages();
          renderConversationsList();

          if (window.PlynetNativeBridge && window.PlynetNativeBridge.vibrate) {
            window.PlynetNativeBridge.vibrate(30);
          }
        }
      }, 1500);
    }, 600);
  }

  function toggleVoiceRecord() {
    const btn = document.getElementById('chat-mic-btn');
    if (!isRecordingVoice) {
      isRecordingVoice = true;
      voiceRecordDuration = 0;
      if (btn) btn.style.color = 'var(--accent-pink)';
      window.PlynetApp.showToast('Recording voice message... 🎙️');
      if (window.PlynetNativeBridge && window.PlynetNativeBridge.vibrate) {
        window.PlynetNativeBridge.vibrate(40);
      }
    } else {
      isRecordingVoice = false;
      if (btn) btn.style.color = '';
      sendVoiceMessage();
    }
  }

  function sendVoiceMessage() {
    if (!activeChatId) return;
    const currentUser = window.PlynetAuth.getUser();
    const db = window.PlynetFirebase.getDb();
    if (!db.messages[activeChatId]) db.messages[activeChatId] = [];

    db.messages[activeChatId].push({
      id: 'm_v_' + Date.now(),
      senderId: currentUser ? currentUser.id : 'current_user',
      type: 'voice',
      duration: 8,
      timestamp: Date.now()
    });

    if (db.chats[activeChatId]) {
      db.chats[activeChatId].lastMessage = '🎙️ Voice note (0:08)';
    }
    window.PlynetFirebase.saveDb();
    renderMessages();
    window.PlynetApp.showToast('Voice message sent! 🎙️');
  }

  function showMsgOptions(msgId, text) {
    let html = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn-secondary" onclick="navigator.clipboard.writeText('${text}');window.PlynetApp.closeModal();window.PlynetApp.showToast('Copied to clipboard');">📋 Copy Text</button>
        <button class="btn-secondary" onclick="window.PlynetMessaging.deleteMsg('${msgId}')" style="color:var(--accent-pink);">🗑️ Delete Message</button>
      </div>
    `;
    window.PlynetApp.openCustomSheet('Message Options', html);
  }

  function deleteMsg(msgId) {
    const db = window.PlynetFirebase.getDb();
    if (activeChatId && db.messages[activeChatId]) {
      const idx = db.messages[activeChatId].findIndex(m => m.id === msgId);
      if (idx !== -1) {
        db.messages[activeChatId].splice(idx, 1);
        window.PlynetFirebase.saveDb();
        renderMessages();
      }
    }
    window.PlynetApp.closeModal();
  }

  return {
    init,
    renderConversationsList,
    openChatWithUser,
    sendMessage,
    toggleVoiceRecord,
    showMsgOptions,
    deleteMsg
  };
})();
