// TORMAG Standalone Service Worker with Web Push listener for iOS & Android
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'TORMAG.KZ', body: 'Обновление по вашему заказу в TORMAG' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || 'TORMAG.KZ';
  const options = {
    body: data.body || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: data.data || { url: '/cabinet/orders' },
    vibrate: [200, 100, 200],
    tag: 'tormag-push-' + Date.now(),
    renotify: true
  };

  // Ensure showNotification is executed first inside event.waitUntil
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          for (let client of windowClients) {
            client.postMessage({
              type: 'TORMAG_PUSH_RECEIVED',
              title: title,
              body: data.body,
              data: data.data
            });
          }
        });
      })
      .catch((err) => {
        console.error('Service Worker showNotification error:', err);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
