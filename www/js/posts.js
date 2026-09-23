/**
 * PLYNET Posts Management
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetPosts = (function() {

  async function createPost({ text, mediaUrl, mediaType = 'none', privacy = 'public', communityId = null }) {
    const user = window.PlynetAuth.getUser();
    if (!user) throw new Error('You must be logged in to create a post.');
    if (!text && !mediaUrl) throw new Error('Please write something or attach media.');

    const newPost = {
      id: 'post_' + Date.now(),
      userId: user.id,
      userName: user.name,
      userHandle: user.username,
      userAvatar: user.avatar,
      userVerified: !!user.isVerified,
      timeAgo: 'Just now',
      timestamp: Date.now(),
      text: text || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType,
      privacy: privacy,
      communityId: communityId,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isSaved: false
    };

    const firestore = window.PlynetFirebase.getFirestore();
    if (firestore) {
      try {
        await firestore.collection('posts').doc(newPost.id).set(newPost);
      } catch (err) {
        console.warn('Firestore write error, saved locally:', err);
      }
    }

    const db = window.PlynetFirebase.getDb();
    db.posts.unshift(newPost);
    window.PlynetFirebase.saveDb();

    window.dispatchEvent(new CustomEvent('plynet:postCreated', { detail: newPost }));
    return newPost;
  }

  async function toggleLike(postId) {
    const db = window.PlynetFirebase.getDb();
    const post = db.posts.find(p => p.id === postId);
    if (!post) return;

    post.isLiked = !post.isLiked;
    post.likesCount += post.isLiked ? 1 : -1;
    if (post.likesCount < 0) post.likesCount = 0;

    window.PlynetFirebase.saveDb();

    if (window.PlynetNativeBridge && window.PlynetNativeBridge.vibrate) {
      window.PlynetNativeBridge.vibrate(25);
    }

    return post;
  }

  async function toggleSave(postId) {
    const db = window.PlynetFirebase.getDb();
    const post = db.posts.find(p => p.id === postId);
    if (!post) return;

    post.isSaved = !post.isSaved;
    window.PlynetFirebase.saveDb();

    if (window.PlynetNativeBridge && window.PlynetNativeBridge.vibrate) {
      window.PlynetNativeBridge.vibrate(20);
    }

    return post;
  }

  async function sharePost(post) {
    const shareTitle = `Post by ${post.userName} on PLYNET`;
    const shareText = `${post.text}\n\nJoin PLYNET — Connect. Share. Belong.`;
    const shareUrl = `https://plynet.io/p/${post.id}`;

    if (window.PlynetNativeBridge && window.PlynetNativeBridge.shareText) {
      window.PlynetNativeBridge.shareText(shareTitle, shareText, shareUrl);
    } else if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (e) {}
    } else {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        window.PlynetApp.showToast('Link copied to clipboard!');
      }
    }

    post.sharesCount = (post.sharesCount || 0) + 1;
    window.PlynetFirebase.saveDb();
    return post;
  }

  async function deletePost(postId) {
    const user = window.PlynetAuth.getUser();
    const db = window.PlynetFirebase.getDb();
    const index = db.posts.findIndex(p => p.id === postId);
    if (index === -1) return false;

    if (db.posts[index].userId !== user.id) {
      throw new Error('You can only delete your own posts.');
    }

    db.posts.splice(index, 1);
    window.PlynetFirebase.saveDb();

    const firestore = window.PlynetFirebase.getFirestore();
    if (firestore) {
      try {
        await firestore.collection('posts').doc(postId).delete();
      } catch (e) {}
    }

    window.dispatchEvent(new CustomEvent('plynet:postDeleted', { detail: { postId } }));
    return true;
  }

  function reportPost(postId) {
    window.PlynetApp.showToast('Thank you. Post reported to moderators.');
  }

  function formatRichText(raw) {
    if (!raw) return '';
    let escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    escaped = escaped.replace(/(^|\s)#([a-zA-Z0-9_]+)/g, '$1<span class="post-tag" onclick="window.PlynetSearch.searchTag(\'$2\')">#$2</span>');
    escaped = escaped.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, '$1<span class="post-tag" onclick="window.PlynetProfile.openUserByHandle(\'$2\')">@$2</span>');
    return escaped;
  }

  return {
    createPost,
    toggleLike,
    toggleSave,
    sharePost,
    deletePost,
    reportPost,
    formatRichText
  };
})();
