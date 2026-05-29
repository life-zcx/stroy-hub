const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() || '';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org';

export const sendTelegramNotification = async (order) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[TELEGRAM BYPASS] Telegram Bot Token or Chat ID not set. Skipping notification.');
    return;
  }

  try {
    const itemsText = order.items
      .map((item) => {
        const productName = item.product?.name || 'Товар';
        return `🔹 ${productName}\n   Кол-во: ${item.quantity} шт. | Цена: ${item.price.toLocaleString('ru-RU')} ₸`;
      })
      .join('\n');

    const message = `🔔 *Новый заказ №${order.id}*\n\n` +
      `👤 *Клиент:* ${order.clientName}\n` +
      `📞 *Телефон:* ${order.clientPhone}\n` +
      `📍 *Адрес:* ${order.clientAddress}\n` +
      `💳 *Оплата:* ${order.paymentMethod}\n\n` +
      `📦 *Состав заказа:*\n${itemsText}\n\n` +
      `💰 *Итого к оплате:* *${order.totalAmount.toLocaleString('ru-RU')} ₸*`;

    // Remove any trailing slashes from the base API URL
    const apiBase = TELEGRAM_API_BASE.replace(/\/+$/, '');
    const url = `${apiBase}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // We run it asynchronously and catch errors to never block order confirmation
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    })
      .then((res) => {
        if (!res.ok) {
          res.text().then((text) => {
            console.error('[TELEGRAM ERROR] Telegram API returned non-OK response:', text);
          });
        } else {
          console.log(`[TELEGRAM SUCCESS] Notification sent for order #${order.id}`);
        }
      })
      .catch((err) => {
        console.error('[TELEGRAM ERROR] Failed to send Telegram request:', err.message);
      });
  } catch (error) {
    console.error('[TELEGRAM ERROR] Error compiling Telegram message:', error.message);
  }
};
