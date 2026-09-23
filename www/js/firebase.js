/**
 * PLYNET Firebase Service
 * Brand: PLYNET — Connect. Share. Belong.
 * Provides unified Firebase integration with Cloud Firestore, Auth, Storage,
 * and resilient local caching/fallback mode.
 */

window.PlynetFirebase = (function() {
  const STORAGE_KEY_CONFIG = 'plynet_firebase_config';
  const STORAGE_KEY_STORE = 'plynet_local_db';

  // Default configuration (or placeholder loaded from env/settings)
  let config = {
    apiKey: "",
    authDomain: "plynet-network.firebaseapp.com",
    projectId: "plynet-network",
    storageBucket: "plynet-network.appspot.com",
    messagingSenderId: "416563224969",
    appId: "1:416563224969:android:plynet"
  };

  // Load user-saved config if present
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      config = Object.assign(config, JSON.parse(saved));
    }
  } catch (e) {
    console.warn('Could not read saved Firebase config:', e);
  }

  let isInitialized = false;
  let firestoreInstance = null;
  let authInstance = null;
  let storageInstance = null;

  // Initialize Firebase if SDK is present
  function init() {
    if (typeof firebase !== 'undefined' && config.apiKey) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }
        firestoreInstance = firebase.firestore ? firebase.firestore() : null;
        authInstance = firebase.auth ? firebase.auth() : null;
        storageInstance = firebase.storage ? firebase.storage() : null;
        isInitialized = true;
        console.log('Firebase initialized with Project ID:', config.projectId);
      } catch (err) {
        console.warn('Firebase init failed, switching to local offline store:', err);
      }
    } else {
      console.log('Using PLYNET resilient local database mode');
    }
    initLocalDb();
  }

  // Local storage backup database to guarantee offline and immediate functionality
  let localDb = {
    users: {},
    posts: [],
    chats: {},
    messages: {},
    communities: [],
    notifications: [],
    calls: {}
  };

  function initLocalDb() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STORE);
      if (stored) {
        localDb = JSON.parse(stored);
      } else {
        seedInitialData();
      }
    } catch (e) {
      seedInitialData();
    }
  }

  function saveLocalDb() {
    try {
      localStorage.setItem(STORAGE_KEY_STORE, JSON.stringify(localDb));
    } catch (e) {
      console.error('Failed to save local db:', e);
    }
  }

  // Seed sample high quality social data so the app looks vibrant immediately
  function seedInitialData() {
    localDb.users = {
      'user_1': {
        id: 'user_1',
        name: 'Elena Rostova',
        username: 'elena_design',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        bio: 'Product Designer & Visual Artist ✨ Exploring the intersection of human empathy and spatial interfaces.',
        followers: 1420,
        following: 382,
        isVerified: true,
        isPremium: true
      },
      'user_2': {
        id: 'user_2',
        name: 'Marcus Chen',
        username: 'marcus_ai',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        bio: 'Building open-source AI algorithms. Passionate about WebRTC and peer-to-peer networks.',
        followers: 2890,
        following: 195,
        isVerified: true,
        isPremium: false
      },
      'user_3': {
        id: 'user_3',
        name: 'Sophia Williams',
        username: 'sophia_travel',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        bio: 'Digital nomad & travel storyteller. Currently sipping espresso in Lisbon ☕️',
        followers: 5120,
        following: 420,
        isVerified: false,
        isPremium: true
      }
    };

    localDb.posts = [
      {
        id: 'post_1',
        userId: 'user_1',
        userName: 'Elena Rostova',
        userHandle: 'elena_design',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        userVerified: true,
        timeAgo: '15m ago',
        timestamp: Date.now() - 15 * 60 * 1000,
        text: 'Just finished polishing the new UI design system for PLYNET! Minimal, tactile, and built for real human connection. What do you all think? ✨ #design #ui #plynet #community',
        mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        likesCount: 142,
        commentsCount: 18,
        sharesCount: 24,
        isLiked: false,
        isSaved: false,
        privacy: 'public'
      },
      {
        id: 'post_2',
        userId: 'user_2',
        userName: 'Marcus Chen',
        userHandle: 'marcus_ai',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        userVerified: true,
        timeAgo: '1h ago',
        timestamp: Date.now() - 60 * 60 * 1000,
        text: 'Testing peer-to-peer WebRTC voice & video calling on Android. Low latency, crystal-clear audio codecs, and zero dropped frames. The future of decentralized social is here! 🚀📞 #tech #webrtc #android',
        mediaUrl: '',
        mediaType: 'none',
        likesCount: 95,
        commentsCount: 12,
        sharesCount: 8,
        isLiked: true,
        isSaved: true,
        privacy: 'public'
      },
      {
        id: 'post_3',
        userId: 'user_3',
        userName: 'Sophia Williams',
        userHandle: 'sophia_travel',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        userVerified: false,
        timeAgo: '3h ago',
        timestamp: Date.now() - 180 * 60 * 1000,
        text: 'Sunrise over the Atlantic ocean this morning. Reminds me that every day brings a clean canvas to connect and create. 🌅 #nature #morning #wanderlust',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        likesCount: 310,
        commentsCount: 42,
        sharesCount: 19,
        isLiked: false,
        isSaved: false,
        privacy: 'public'
      }
    ];

    localDb.communities = [
      {
        id: 'comm_tech',
        name: 'Tech & Engineers',
        handle: 'tech_network',
        description: 'Where coders, systems designers, and creators build the next internet.',
        avatar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80',
        cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        membersCount: 8420,
        isJoined: true,
        category: 'Technology'
      },
      {
        id: 'comm_creatives',
        name: 'Designers & Creators',
        handle: 'creatives_hub',
        description: 'Showcase visual arts, typography, UI/UX, and 3D animations.',
        avatar: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=150&auto=format&fit=crop&q=80',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        membersCount: 12400,
        isJoined: false,
        category: 'Art & Design'
      },
      {
        id: 'comm_founders',
        name: 'Startups & Builders',
        handle: 'builders_club',
        description: 'Discussions on product launch, growth strategies, and fundraising.',
        avatar: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&auto=format&fit=crop&q=80',
        cover: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        membersCount: 6510,
        isJoined: false,
        category: 'Business'
      }
    ];

    localDb.chats = {
      'chat_user_1': {
        id: 'chat_user_1',
        partnerId: 'user_1',
        lastMessage: 'Hey! Are you ready for our WebRTC video call?',
        timestamp: Date.now() - 10 * 60 * 1000,
        unreadCount: 1
      },
      'chat_user_2': {
        id: 'chat_user_2',
        partnerId: 'user_2',
        lastMessage: 'The audio codecs look super clean on Android!',
        timestamp: Date.now() - 55 * 60 * 1000,
        unreadCount: 0
      }
    };

    localDb.messages = {
      'chat_user_1': [
        {
          id: 'm1',
          senderId: 'user_1',
          text: 'Hi there! Welcome to PLYNET! ✨',
          timestamp: Date.now() - 30 * 60 * 1000,
          status: 'read'
        },
        {
          id: 'm2',
          senderId: 'current_user',
          text: 'Loving the clean design and smooth navigation.',
          timestamp: Date.now() - 20 * 60 * 1000,
          status: 'read'
        },
        {
          id: 'm3',
          senderId: 'user_1',
          text: 'Hey! Are you ready for our WebRTC video call?',
          timestamp: Date.now() - 10 * 60 * 1000,
          status: 'unread'
        }
      ],
      'chat_user_2': [
        {
          id: 'm4',
          senderId: 'user_2',
          text: 'The audio codecs look super clean on Android!',
          timestamp: Date.now() - 55 * 60 * 1000,
          status: 'read'
        }
      ]
    };

    localDb.notifications = [
      {
        id: 'n1',
        type: 'like',
        actorName: 'Elena Rostova',
        actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'liked your post.',
        timeAgo: '10m ago',
        unread: true
      },
      {
        id: 'n2',
        type: 'follow',
        actorName: 'Marcus Chen',
        actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        text: 'started following you.',
        timeAgo: '1h ago',
        unread: false
      }
    ];

    saveLocalDb();
  }

  // Public API
  return {
    init,
    getConfig: () => config,
    saveConfig: function(newConfig) {
      config = Object.assign(config, newConfig);
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
      init();
    },
    isLiveFirebase: () => isInitialized && !!firestoreInstance,
    getDb: () => localDb,
    saveDb: saveLocalDb,
    getFirestore: () => firestoreInstance,
    getAuth: () => authInstance,
    getStorage: () => storageInstance
  };
})();
