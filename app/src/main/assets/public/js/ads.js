/**
 * PLYNET Ads Management (Google AdMob Integration)
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetAds = (function() {
  let adsEnabled = true;
  let lastInterstitialTime = 0;

  function shouldShowFeedAd() {
    const user = window.PlynetAuth.getUser();
    if (user && user.isPremium) return false;
    return adsEnabled;
  }

  function renderFeedAdCard() {
    return `
      <div class="post-card" style="background:linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(236, 72, 153, 0.06)); border: 1px dashed var(--primary-300);">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px 4px 14px;">
          <span style="font-size:0.7rem;font-weight:700;color:var(--text-tertiary);letter-spacing:0.5px;">SPONSORED • ADMOB</span>
          <span style="font-size:0.75rem;cursor:pointer;color:var(--primary-500);font-weight:600;" onclick="window.PlynetSettings.openPremiumModal()">Remove Ads</span>
        </div>
        <div style="padding:4px 14px 12px 14px;">
          <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:4px;">Upgrade to PLYNET Ultra Speed Cloud ☁️</div>
          <p style="font-size:0.86rem;color:var(--text-secondary);line-height:1.4;">Zero buffering WebRTC calling, HD 4K video uploads, and verified golden status.</p>
        </div>
        <div style="padding:8px 14px 12px 14px;">
          <button class="btn-primary" style="padding:8px 16px;font-size:0.85rem;" onclick="window.PlynetSettings.openPremiumModal()">Learn More</button>
        </div>
      </div>
    `;
  }

  function showInterstitialAd() {
    const user = window.PlynetAuth.getUser();
    if (user && user.isPremium) return;

    const now = Date.now();
    // Frequency cap: at most once every 60 seconds
    if (now - lastInterstitialTime < 60000) return;
    lastInterstitialTime = now;

    if (window.PlynetNativeBridge && window.PlynetNativeBridge.simulateAd) {
      window.PlynetNativeBridge.simulateAd('interstitial', 'window.PlynetAds.onAdClosed');
    } else {
      console.log('AdMob interstitial triggered');
    }
  }

  function showRewardedAd(onRewardEarned) {
    window.PlynetApp.showToast('Showing AdMob Rewarded Video Ad... 🎁');
    setTimeout(() => {
      window.PlynetApp.showToast('Reward granted! Thank you for supporting PLYNET ✨');
      if (typeof onRewardEarned === 'function') onRewardEarned();
    }, 1500);
  }

  return {
    shouldShowFeedAd,
    renderFeedAdCard,
    showInterstitialAd,
    showRewardedAd
  };
})();
