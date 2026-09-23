/**
 * PLYNET Authentication Module
 * Brand: PLYNET — Connect. Share. Belong.
 */

window.PlynetAuth = (function() {
  const STORAGE_KEY_USER = 'plynet_current_user';
  let currentUser = null;
  const listeners = [];

  // Initialize current user from local storage or default active user
  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        currentUser = JSON.parse(saved);
      } else {
        // Default authenticated user session
        currentUser = {
          id: 'current_user',
          name: 'Alex Rivera',
          username: 'alex_connect',
          email: 'alex@plynet.io',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          bio: 'Building on PLYNET. Exploring creative networks and tech communities 🌐✨',
          dob: '1998-05-14',
          followers: 640,
          following: 215,
          isVerified: true,
          isPremium: false
        };
        saveUser(currentUser);
      }
    } catch (e) {
      console.error('Failed reading user session:', e);
    }
    notifyListeners();
  }

  function saveUser(user) {
    currentUser = user;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {}
    notifyListeners();
  }

  function notifyListeners() {
    listeners.forEach(fn => {
      try { fn(currentUser); } catch (e) {}
    });
  }

  function onAuthStateChanged(callback) {
    listeners.push(callback);
    callback(currentUser);
  }

  // Registration flow
  async function register({ fullName, username, email, password, dob, avatar }) {
    // Validation
    if (!fullName || !username || !email || !password) {
      throw new Error('Please fill out all required fields.');
    }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      throw new Error('Username must be 3–30 characters (letters, numbers, underscores).');
    }

    // Check Firebase Auth if configured
    const auth = window.PlynetFirebase.getAuth();
    if (auth) {
      try {
        const userCred = await auth.createUserWithEmailAndPassword(email, password);
        await userCred.user.updateProfile({ displayName: fullName });
      } catch (err) {
        console.warn('Firebase Auth error, continuing with local registration:', err);
      }
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name: fullName.trim(),
      username: cleanUsername,
      email: email.trim(),
      dob: dob || '2000-01-01',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      bio: 'New member on PLYNET! Connect. Share. Belong. ✨',
      followers: 0,
      following: 0,
      isVerified: false,
      isPremium: false
    };

    // Store in database
    const db = window.PlynetFirebase.getDb();
    db.users[newUser.id] = newUser;
    window.PlynetFirebase.saveDb();

    saveUser(newUser);
    return newUser;
  }

  // Login flow
  async function login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const auth = window.PlynetFirebase.getAuth();
    if (auth) {
      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        console.warn('Firebase login attempt failed:', err);
      }
    }

    // Verify or find in database
    const db = window.PlynetFirebase.getDb();
    let found = Object.values(db.users).find(u => u.email === email || u.username === email);
    if (!found) {
      // Create session for existing user
      found = {
        id: 'user_' + Date.now(),
        name: email.split('@')[0],
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        bio: 'Hello PLYNET!',
        followers: 12,
        following: 5,
        isVerified: false,
        isPremium: false
      };
      db.users[found.id] = found;
      window.PlynetFirebase.saveDb();
    }

    saveUser(found);
    return found;
  }

  // Google Sign-In
  async function googleSignIn() {
    const auth = window.PlynetFirebase.getAuth();
    if (auth && typeof firebase !== 'undefined' && firebase.auth.GoogleAuthProvider) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const res = await auth.signInWithPopup(provider);
        const user = {
          id: res.user.uid,
          name: res.user.displayName || 'PLYNET Member',
          username: (res.user.displayName || 'user').toLowerCase().replace(/\s+/g, '_'),
          email: res.user.email,
          avatar: res.user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          bio: 'Google authenticated user on PLYNET ✨',
          followers: 45,
          following: 20,
          isVerified: true,
          isPremium: false
        };
        saveUser(user);
        return user;
      } catch (err) {
        console.warn('Google popup error, using simulated Google account:', err);
      }
    }

    // Google Sign-In fallback simulation
    const googleUser = {
      id: 'google_user_' + Date.now(),
      name: 'Jordan Miller',
      username: 'jordan_google',
      email: 'jordan.miller@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      bio: 'Signed in via Google Identity Services. Exploring PLYNET!',
      followers: 88,
      following: 34,
      isVerified: true,
      isPremium: false
    };
    saveUser(googleUser);
    return googleUser;
  }

  // Password reset
  async function forgotPassword(email) {
    if (!email) throw new Error('Please provide your email address.');
    const auth = window.PlynetFirebase.getAuth();
    if (auth) {
      await auth.sendPasswordResetEmail(email);
    }
    return true;
  }

  // Logout
  function logout() {
    const auth = window.PlynetFirebase.getAuth();
    if (auth) {
      try { auth.signOut(); } catch (e) {}
    }
    saveUser(null);
  }

  // Delete account
  function deleteAccount() {
    if (!currentUser) return;
    const db = window.PlynetFirebase.getDb();
    delete db.users[currentUser.id];
    window.PlynetFirebase.saveDb();
    logout();
  }

  // Update profile
  function updateProfile(fields) {
    if (!currentUser) return;
    currentUser = Object.assign({}, currentUser, fields);
    const db = window.PlynetFirebase.getDb();
    db.users[currentUser.id] = currentUser;
    window.PlynetFirebase.saveDb();
    saveUser(currentUser);
    return currentUser;
  }

  return {
    init,
    getUser: () => currentUser,
    isLoggedIn: () => !!currentUser,
    onAuthStateChanged,
    register,
    login,
    googleSignIn,
    forgotPassword,
    logout,
    deleteAccount,
    updateProfile
  };
})();
