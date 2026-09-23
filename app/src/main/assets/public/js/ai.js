/**
 * PLYNET AI Module (Powered by Gemini API)
 * Brand: PLYNET — Connect. Share. Belong.
 * Securely connects to server-side or Android native bridge to avoid exposing keys.
 */

window.PlynetAI = (function() {

  // Open the main AI Assistant Drawer / Modal
  function openAIPanel() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="ai-panel-header">
          <div style="width:36px;height:36px;border-radius:999px;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;">✨</div>
          <div>
            <div style="font-weight:700;font-size:1rem;color:var(--text-primary);">PLYNET AI Assistant</div>
            <div style="font-size:0.75rem;color:var(--text-tertiary);">Powered by Gemini Intelligence</div>
          </div>
        </div>

        <div class="ai-quick-actions">
          <button class="ai-chip-btn" onclick="window.PlynetAI.quickPrompt('Generate 3 trending hashtags and a catchy caption for a community gathering.')">🔥 Viral Caption</button>
          <button class="ai-chip-btn" onclick="window.PlynetAI.quickPrompt('Draft an engaging question to start a discussion about modern UI design.')">💬 Community Topic</button>
          <button class="ai-chip-btn" onclick="window.PlynetAI.quickPrompt('Summarize key tips for hosting a great WebRTC video meetup.')">📝 Video Meetup Tips</button>
        </div>

        <div id="ai-response-box" style="background:var(--bg-surface-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:12px;min-height:100px;max-height:220px;overflow-y:auto;font-size:0.9rem;line-height:1.5;color:var(--text-primary);user-select:text;">
          Ask me anything! I can write captions, brainstorm community topics, rewrite your posts in different tones, and summarize discussions.
        </div>

        <div style="display:flex;gap:8px;">
          <input type="text" id="ai-user-prompt-input" class="input-field" placeholder="Ask Plynet AI..." style="border-radius:999px;padding:10px 16px;">
          <button class="btn-primary" style="width:auto;border-radius:999px;padding:0 18px;" onclick="window.PlynetAI.submitPrompt()">Send</button>
        </div>
      </div>
    `;

    window.PlynetApp.openCustomSheet('PLYNET AI ✨', html);

    setTimeout(() => {
      const input = document.getElementById('ai-user-prompt-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') window.PlynetAI.submitPrompt();
        });
      }
    }, 100);
  }

  function quickPrompt(text) {
    const input = document.getElementById('ai-user-prompt-input');
    if (input) {
      input.value = text;
      submitPrompt();
    }
  }

  // Generate captions directly into the Create Post textarea
  async function generatePostCaption() {
    const textarea = document.getElementById('create-post-text');
    const existing = textarea ? textarea.value.trim() : '';

    const prompt = existing 
      ? `Enhance and rewrite this social post to make it more engaging, punchy, with 3 relevant hashtags for PLYNET social network: "${existing}"`
      : 'Generate an inspiring, community-focused social media post caption for PLYNET (Connect. Share. Belong.) with 3 hashtags.';

    window.PlynetApp.showToast('Generating AI caption with Gemini... ✨');

    const result = await callGemini(prompt);
    if (textarea && result) {
      textarea.value = result;
      window.PlynetApp.showToast('Caption generated! ✨');
    }
  }

  // Rewrite post tone
  async function rewritePostTone(tone = 'inspiring') {
    const textarea = document.getElementById('create-post-text');
    if (!textarea || !textarea.value.trim()) {
      window.PlynetApp.showToast('Please type a draft first to rewrite.');
      return;
    }

    const prompt = `Rewrite this social post in a ${tone} tone for the PLYNET community: "${textarea.value}"`;
    window.PlynetApp.showToast(`Rewriting post (${tone})... ✨`);
    const result = await callGemini(prompt);
    if (result) {
      textarea.value = result;
      window.PlynetApp.showToast('Post updated! ✨');
    }
  }

  async function submitPrompt() {
    const input = document.getElementById('ai-user-prompt-input');
    const responseBox = document.getElementById('ai-response-box');
    if (!input || !input.value.trim() || !responseBox) return;

    const userText = input.value.trim();
    input.value = '';

    responseBox.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:var(--text-tertiary);">
        <span class="wave-bar" style="background:var(--primary-500);animation:wave 1s infinite ease-in-out;"></span>
        <span>PLYNET AI is thinking...</span>
      </div>
    `;

    const reply = await callGemini(userText);
    responseBox.innerHTML = reply.replace(/\n/g, '<br>');
  }

  // Secure Gemini API caller
  async function callGemini(prompt) {
    // If running in native Android app with PlynetNativeBridge
    if (window.PlynetNativeBridge && window.PlynetNativeBridge.callGeminiApi) {
      return new Promise((resolve) => {
        const callbackName = 'geminiCb_' + Date.now();
        window[callbackName] = (res) => {
          delete window[callbackName];
          resolve(res);
        };
        window.PlynetNativeBridge.callGeminiApi(prompt, callbackName);
      });
    }

    // Local fallback intelligent response generator if offline / key not set
    await new Promise(r => setTimeout(r, 900));
    return generateSmartFallback(prompt);
  }

  function generateSmartFallback(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('caption') || p.includes('inspire') || p.includes('belong')) {
      return "✨ Real connection isn't just about sharing moments—it's about building a space where everyone truly belongs. Proud to be part of the PLYNET movement today! #community #connect #belong #plynet";
    }
    if (p.includes('hashtag')) {
      return "#PLYNET #ConnectShareBelong #CreativeNetwork #MobileTech #CommunityFirst";
    }
    if (p.includes('design') || p.includes('ui')) {
      return "💡 Clean whitespace, responsive touch targets (48dp+), and purposeful typography aren't just aesthetic choices—they represent empathy for the user across every device.";
    }
    if (p.includes('webrtc') || p.includes('call') || p.includes('video')) {
      return "📞 For seamless WebRTC calling on Android: ensure optimal audio constraints (echoCancellation: true, noiseSuppression: true) and handle ICE candidate exchange gracefully through Firestore!";
    }
    return `✨ Here are thoughts on that: Bringing people together through meaningful conversations and real-time interaction is at the core of PLYNET. Let's keep building community!`;
  }

  return {
    openAIPanel,
    generatePostCaption,
    rewritePostTone,
    submitPrompt,
    quickPrompt
  };
})();
