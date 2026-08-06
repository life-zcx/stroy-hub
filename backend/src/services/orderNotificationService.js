import { sendTelegramNotification } from '../utils/telegram.js';
import { broadcastNotification } from '../utils/pushNotifier.js';

export const triggerOrderCreatedNotifications = (order) => {
  // Send Telegram Notification (runs asynchronously in background)
  sendTelegramNotification(order);

  // Send Web Push Notification
  broadcastNotification({
    title: `Новый заказ #${order.id}! 🎉`,
    body: `Ваш заказ на сумму ${order.totalAmount.toLocaleString('ru-RU')} ₸ принят и отправлен на обработку!`,
    icon: '/pwa-192x192.png',
    data: { url: '/cabinet/orders' },
  }).catch(() => {});
};

export const triggerOrderStatusChangedNotification = (order) => {
  const STATUS_MAP = {
    pending: 'В обработке',
    processing: 'Принят в работу',
    shipped: 'Передан в доставку',
    completed: 'Выполнен',
    cancelled: 'Отменен',
  };

  broadcastNotification({
    title: `Заказ #${order.id}`,
    body: `Статус вашего заказа изменен: ${STATUS_MAP[order.status] || order.status}`,
    icon: '/pwa-192x192.png',
    data: { url: '/cabinet/orders' },
  }).catch(() => {});
};
