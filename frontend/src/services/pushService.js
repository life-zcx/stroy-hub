const API_BASE = import.meta.env.VITE_API_URL || '/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeUserToPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push-уведомления не поддерживаются вашим браузером');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Разрешение на уведомления отклонено');
  }

  let registration;
  try {
    const existing = await navigator.serviceWorker.getRegistrations();
    for (const reg of existing) {
      if (reg.active && !reg.active.scriptURL.endsWith('/sw.js')) {
        await reg.unregister();
      }
    }
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await registration.update();
    await navigator.serviceWorker.ready;
  } catch (e) {
    registration = await navigator.serviceWorker.ready;
  }
  
  // Fetch VAPID key from backend
  let vapidPublicKey = '';
  try {
    const res = await fetch(`${API_BASE}/push/vapid-key`);
    const data = await res.json();
    vapidPublicKey = data.publicKey;
  } catch (err) {
    console.warn('Using fallback VAPID key');
    vapidPublicKey = 'BLw0vCLr34eFOA9DPxTjuxAvWRIX17QYZAKC2e1q7pCeftG_Br0o5KIRjl643rXqSAEgCey60iaX-aW4T7cFyeY';
  }

  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey
  });

  // Post subscription to backend
  await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription })
  });

  // Display instant local push notification feedback
  try {
    await registration.showNotification('TORMAG.KZ', {
      body: '🎉 Вы успешно подписались на уведомления о заказах и скидках!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'tormag-welcome'
    });
  } catch (e) {
    console.log('Local notification display note:', e);
  }

  return subscription;
};
