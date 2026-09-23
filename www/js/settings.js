/**
 * PLYNET Settings & Premium Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetSettings = (function() {
  const STORAGE_KEY_THEME = 'plynet_app_theme';

  function init() {
    // Apply saved theme
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
    setTheme(savedTheme, false);
  }

  function setTheme(themeName, save = true) {
    document.documentElement.setAttribute('data-theme', themeName);
    if (save) {
      localStorage.setItem(STORAGE_KEY_THEME, themeName);
      window.PlynetApp.showToast(`Theme changed to ${themeName.toUpperCase()}`);
    }
  }

  function openThemeModal() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const html = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="chat-thread-item" onclick="window.PlynetSettings.setTheme('light'); window.PlynetApp.closeModal();">
          <span style="font-size:1.3rem;">☀️</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.95rem;">Clean Light</div>
            <div style="font-size:0.75rem;color:var(--text-tertiary);">Crisp contrast, elegant surfaces</div>
          </div>
          ${current === 'light' ? '<span style="color:var(--primary-500);font-weight:bold;">✓</span>' : ''}
        </div>

        <div class="chat-thread-item" onclick="window.PlynetSettings.setTheme('dark'); window.PlynetApp.closeModal();">
          <span style="font-size:1.3rem;">🌙</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.95rem;">Onyx Dark</div>
            <div style="font-size:0.75rem;color:var(--text-tertiary);">Deep slate, battery saver for OLED</div>
          </div>
          ${current === 'dark' ? '<span style="color:var(--primary-500);font-weight:bold;">✓</span>' : ''}
        </div>

        <div class="chat-thread-item" onclick="window.PlynetSettings.setTheme('midnight'); window.PlynetApp.closeModal();">
          <span style="font-size:1.3rem;">✨</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.95rem;">Midnight Gold (Premium)</div>
            <div style="font-size:0.75rem;color:var(--text-tertiary);">Rich amber accents & deep space luxury</div>
          </div>
          ${current === 'midnight' ? '<span style="color:var(--primary-500);font-weight:bold;">✓</span>' : ''}
        </div>
      </div>
    `;

    window.PlynetApp.openCustomSheet('Appearance & Themes', html);
  }

  function openPremiumModal() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;text-align:center;">
        <div style="width:60px;height:60px;border-radius:999px;background:linear-gradient(135deg, #F59E0B, #EC4899);margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:#fff;box-shadow:0 8px 24px rgba(245, 158, 11, 0.4);">
          ★
        </div>
        <div>
          <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">PLYNET Premium</div>
          <div style="font-size:0.85rem;color:var(--text-tertiary);">Unlock the ultimate connected experience</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;text-align:left;background:var(--bg-surface-subtle);padding:14px;border-radius:var(--radius-lg);margin:6px 0;">
          <div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;">
            <span>🚫</span>
            <span><b>100% Ad-Free:</b> Zero sponsored banners or video interruptions</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;">
            <span>✨</span>
            <span><b>Golden Badge:</b> Exclusive verified profile emblem</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;">
            <span>🎨</span>
            <span><b>Luxe Themes:</b> Access Midnight Gold & custom accents</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;">
            <span>📞</span>
            <span><b>Ultra HD WebRTC:</b> 1080p video calling with low-latency priority</span>
          </div>
        </div>

        <button class="btn-primary" style="background:linear-gradient(135deg, #F59E0B, #D97706);" onclick="window.PlynetSettings.processPlayBillingPurchase('plynet_premium_monthly')">
          Upgrade with Google Play ($3.99 / mo)
        </button>
        <span style="font-size:0.75rem;color:var(--text-tertiary);">Secured by Google Play In-App Billing</span>
      </div>
    `;

    window.PlynetApp.openCustomSheet('PLYNET Premium', html);
  }

  function processPlayBillingPurchase(sku) {
    if (window.PlynetNativeBridge && window.PlynetNativeBridge.purchasePremium) {
      window.PlynetNativeBridge.purchasePremium(sku, 'window.PlynetSettings.onPurchaseSuccess');
    } else {
      // Simulate successful billing purchase flow
      window.PlynetApp.showToast('Connecting to Google Play Store...');
      setTimeout(() => {
        const user = window.PlynetAuth.getUser();
        if (user) {
          window.PlynetAuth.updateProfile({ isPremium: true });
        }
        window.PlynetApp.closeModal();
        window.PlynetApp.showToast('Congratulations! Welcome to PLYNET Premium! ★');
        setTheme('midnight');
      }, 1200);
    }
  }

  function openFirebaseConfigModal() {
    const cfg = window.PlynetFirebase.getConfig();
    const html = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.4;">
          PLYNET includes local zero-config cloud emulation. You can also plug in your live Firebase project credentials below:
        </p>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:var(--text-tertiary);">API Key</label>
          <input type="text" id="fb-cfg-apiKey" class="input-field" value="${cfg.apiKey || ''}" placeholder="AIzaSy...">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:var(--text-tertiary);">Project ID</label>
          <input type="text" id="fb-cfg-projectId" class="input-field" value="${cfg.projectId || ''}">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:var(--text-tertiary);">Auth Domain</label>
          <input type="text" id="fb-cfg-authDomain" class="input-field" value="${cfg.authDomain || ''}">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:var(--text-tertiary);">Storage Bucket</label>
          <input type="text" id="fb-cfg-storageBucket" class="input-field" value="${cfg.storageBucket || ''}">
        </div>
        <button class="btn-primary" onclick="window.PlynetSettings.saveFirebaseConfig()">Save Configuration</button>
      </div>
    `;

    window.PlynetApp.openCustomSheet('Firebase Setup', html);
  }

  function saveFirebaseConfig() {
    const apiKey = document.getElementById('fb-cfg-apiKey')?.value?.trim();
    const projectId = document.getElementById('fb-cfg-projectId')?.value?.trim();
    const authDomain = document.getElementById('fb-cfg-authDomain')?.value?.trim();
    const storageBucket = document.getElementById('fb-cfg-storageBucket')?.value?.trim();

    window.PlynetFirebase.saveConfig({
      apiKey,
      projectId,
      authDomain,
      storageBucket
    });

    window.PlynetApp.closeModal();
    window.PlynetApp.showToast('Firebase configuration updated!');
  }

  function openBlockedUsersModal() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="empty-state" style="padding:24px 0;">
          <div style="font-size:2rem;margin-bottom:6px;">🛡️</div>
          <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">No Blocked Users</div>
          <div style="font-size:0.8rem;color:var(--text-tertiary);">People you block will not be able to message or call you.</div>
        </div>
      </div>
    `;
    window.PlynetApp.openCustomSheet('Blocked Users', html);
  }

  function openAboutModal() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;text-align:center;">
        <div class="brand-badge" style="width:52px;height:52px;margin:0 auto;font-size:1.6rem;">P</div>
        <div>
          <div style="font-weight:800;font-size:1.2rem;color:var(--text-primary);">PLYNET</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);font-weight:600;">Connect. Share. Belong.</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;">Version 1.0.0 (Production Release)</div>
        </div>
        <p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.5;text-align:left;background:var(--bg-surface-subtle);padding:12px;border-radius:var(--radius-md);">
          PLYNET is a high-performance community social network designed for real-time conversation, WebRTC calling, and collaborative communities. Built with HTML5, CSS3, JavaScript, WebRTC, Firebase, and Capacitor Android Native integration.
        </p>
      </div>
    `;
    window.PlynetApp.openCustomSheet('About PLYNET', html);
  }

  function confirmDeleteAccount() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;text-align:center;">
        <div style="font-size:2.5rem;">⚠️</div>
        <div style="font-weight:800;font-size:1.15rem;color:var(--accent-pink);">Delete Account Permanently?</div>
        <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.4;">
          This will permanently delete your profile, posts, messages, and followers. This action cannot be undone.
        </p>
        <div style="display:flex;gap:10px;">
          <button class="btn-secondary" style="flex:1;" onclick="window.PlynetApp.closeModal();">Cancel</button>
          <button class="btn-primary" style="flex:1;background:var(--accent-pink);" onclick="window.PlynetAuth.deleteAccount(); window.PlynetApp.closeModal(); window.PlynetApp.showToast('Account deleted');">Delete</button>
        </div>
      </div>
    `;
    window.PlynetApp.openCustomSheet('Delete Account', html);
  }

  return {
    init,
    setTheme,
    openThemeModal,
    openPremiumModal,
    processPlayBillingPurchase,
    openFirebaseConfigModal,
    saveFirebaseConfig,
    openBlockedUsersModal,
    openAboutModal,
    confirmDeleteAccount
  };
})();
