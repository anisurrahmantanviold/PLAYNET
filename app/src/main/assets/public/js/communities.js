/**
 * PLYNET Communities Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetCommunities = (function() {
  let activeCommunityId = null;

  function init() {
    renderCommunitiesList();
  }

  function renderCommunitiesList() {
    const grid = document.getElementById('communities-grid-container');
    if (!grid) return;

    const db = window.PlynetFirebase.getDb();
    const communities = db.communities || [];

    if (communities.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">👥</div>
          <div class="empty-title">No communities yet</div>
          <div class="empty-subtitle">Create the first group around your passion!</div>
        </div>
      `;
      return;
    }

    let html = '';
    communities.forEach(c => {
      html += `
        <div class="community-card" onclick="window.PlynetCommunities.openCommunity('${c.id}')">
          <img src="${c.avatar}" class="community-avatar" alt="${c.name}">
          <div class="community-name">${c.name}</div>
          <div class="community-meta">${(c.membersCount || 0).toLocaleString()} members</div>
          <button class="${c.isJoined ? 'btn-secondary' : 'btn-primary'}" 
                  style="width:100%;padding:6px 10px;font-size:0.8rem;border-radius:999px;"
                  onclick="event.stopPropagation(); window.PlynetCommunities.toggleJoin('${c.id}')">
            ${c.isJoined ? 'Joined ✓' : 'Join'}
          </button>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  function openCommunity(commId) {
    activeCommunityId = commId;
    const db = window.PlynetFirebase.getDb();
    const comm = db.communities.find(c => c.id === commId);
    if (!comm) return;

    const contentHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="position:relative;height:120px;border-radius:var(--radius-md);overflow:hidden;">
          <img src="${comm.cover}" style="width:100%;height:100%;object-fit:cover;">
          <div style="position:absolute;bottom:10px;left:12px;display:flex;align-items:center;gap:10px;">
            <img src="${comm.avatar}" style="width:48px;height:48px;border-radius:var(--radius-md);border:2px solid #fff;object-fit:cover;">
            <div style="color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.6);">
              <div style="font-weight:800;font-size:1.1rem;">${comm.name}</div>
              <div style="font-size:0.75rem;">@${comm.handle} • ${comm.category || 'General'}</div>
            </div>
          </div>
        </div>

        <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.4;">${comm.description}</p>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--border-subtle);border-bottom:1px solid var(--border-subtle);">
          <span style="font-size:0.85rem;color:var(--text-tertiary);">Members: <b style="color:var(--text-primary);">${(comm.membersCount || 0).toLocaleString()}</b></span>
          <button class="${comm.isJoined ? 'btn-secondary' : 'btn-primary'}" 
                  style="width:auto;padding:6px 18px;border-radius:999px;font-size:0.82rem;"
                  onclick="window.PlynetCommunities.toggleJoin('${comm.id}'); window.PlynetApp.closeModal();">
            ${comm.isJoined ? 'Leave Community' : 'Join Community'}
          </button>
        </div>

        <button class="btn-primary" style="margin-top:6px;" onclick="window.PlynetApp.closeModal(); window.PlynetApp.openCreatePost('${comm.id}')">
          ✏️ Post to this Community
        </button>
      </div>
    `;

    window.PlynetApp.openCustomSheet(comm.name, contentHtml);
  }

  function toggleJoin(commId) {
    const db = window.PlynetFirebase.getDb();
    const comm = db.communities.find(c => c.id === commId);
    if (!comm) return;

    comm.isJoined = !comm.isJoined;
    comm.membersCount = (comm.membersCount || 0) + (comm.isJoined ? 1 : -1);
    if (comm.membersCount < 0) comm.membersCount = 0;

    window.PlynetFirebase.saveDb();
    renderCommunitiesList();

    window.PlynetApp.showToast(comm.isJoined ? `Joined ${comm.name}! ✨` : `Left ${comm.name}`);
  }

  function openCreateCommunityModal() {
    const modalHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Community Name</label>
          <input type="text" id="comm-create-name" class="input-field" placeholder="e.g. Mobile App Innovators">
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Username / Handle</label>
          <input type="text" id="comm-create-handle" class="input-field" placeholder="e.g. mobile_innovators">
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Description</label>
          <textarea id="comm-create-desc" class="input-field textarea-field" style="min-height:70px;" placeholder="What is this community about?"></textarea>
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Category</label>
          <select id="comm-create-cat" class="input-field">
            <option value="Technology">Technology</option>
            <option value="Art & Design">Art & Design</option>
            <option value="Business">Business</option>
            <option value="Music">Music</option>
            <option value="Gaming">Gaming</option>
          </select>
        </div>
        <button class="btn-primary" style="margin-top:6px;" onclick="window.PlynetCommunities.submitNewCommunity()">Create Community</button>
      </div>
    `;

    window.PlynetApp.openCustomSheet('Create Community', modalHtml);
  }

  function submitNewCommunity() {
    const name = document.getElementById('comm-create-name')?.value?.trim();
    const handle = document.getElementById('comm-create-handle')?.value?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const desc = document.getElementById('comm-create-desc')?.value?.trim();
    const cat = document.getElementById('comm-create-cat')?.value;

    if (!name || !handle || !desc) {
      window.PlynetApp.showToast('Please fill out all community details');
      return;
    }

    const newComm = {
      id: 'comm_' + Date.now(),
      name: name,
      handle: handle,
      description: desc,
      category: cat,
      avatar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      membersCount: 1,
      isJoined: true
    };

    const db = window.PlynetFirebase.getDb();
    db.communities.unshift(newComm);
    window.PlynetFirebase.saveDb();

    window.PlynetApp.closeModal();
    window.PlynetApp.showToast(`Community "${name}" created! ✨`);
    renderCommunitiesList();
  }

  return {
    init,
    renderCommunitiesList,
    openCommunity,
    toggleJoin,
    openCreateCommunityModal,
    submitNewCommunity
  };
})();
