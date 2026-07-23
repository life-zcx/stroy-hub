import express from 'express';
import { getVapidPublicKey, saveSubscription, sendPushNotification } from '../utils/pushNotifier.js';

const router = express.Router();

// GET /api/push/vapid-key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// POST /api/push/subscribe
router.post('/subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Невалидные данные подписки' });
  }

  const subId = saveSubscription(userId, subscription);
  
  // Send welcome push notification
  sendPushNotification(subscription, {
    title: 'TORMAG.KZ',
    body: 'Вы успешно подписались на уведомления о заказах и скидках!',
    icon: '/favicon.png',
    data: { url: '/' }
  }).catch(() => {});

  res.json({ success: true, subscriptionId: subId });
});

export default router;
