self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function readPayload(event) {
  if (!event.data) {
    return {
      body: 'A leftover is close to expiring.',
      title: 'Scraps',
      url: '/',
    };
  }

  try {
    return {
      body: 'A leftover is close to expiring.',
      title: 'Scraps',
      url: '/',
      ...event.data.json(),
    };
  } catch (error) {
    return {
      body: event.data.text(),
      title: 'Scraps',
      url: '/',
    };
  }
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event);

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Scraps', {
      body: payload.body ?? 'A leftover is close to expiring.',
      data: {
        itemId: payload.itemId ?? null,
        url: payload.url ?? '/',
      },
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: payload.itemId ?? 'scraps-notification',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
