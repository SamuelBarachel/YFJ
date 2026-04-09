// sw.js - Service Worker for YFJ North America
const CACHE_NAME = 'yfj-na-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png'
];

// 1. Installation: Cache the core files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC_ASSETS))
      .catch((err) => console.log('Caching error during install:', err))
  );
  self.skipWaiting();
});

// 2. Activation: Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 3. Fetch: Network-first approach with cache fallback
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  // Do not intercept API calls (let the network handle them)
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// 4. Push: Handle notifications sent from the Render server
self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data.json();
  } catch (err) {
    data = { body: e.data ? e.data.text() : 'New notification' };
  }

  const title = data.title || 'YFJ North America';
  const body = data.body || 'New notification';

  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'yfj-notification', // Replaces old notification if same tag
    data: data,
    vibrate: [200, 100, 200],
    silent: false,           // Explicitly trigger the system notification sound
    requireInteraction: true // Keeps the banner up until the user taps it
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 5. Notification Click: Handle what happens when a user taps the banner
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      // If the app is already open, focus it
      if (cs.length > 0) {
        cs[0].focus();
        return;
      }
      // Otherwise, open a new window
      clients.openWindow('/');
    })
  );
});

// 6. Message: Handle notifications triggered locally from React (e.g., scheduleNotification)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: e.data.tag || 'yfj-reminder',
      vibrate: [200, 100, 200],
      silent: false
    });
  }
});
