import fs from 'fs';
import path from 'path';
import logger from './logger.js';

let webPush = null;

// Dynamically import web-push if available in current Node environment (Docker container or host)
try {
  const module = await import('web-push');
  webPush = module.default || module;
} catch (e) {
  logger.warn(`[WEB PUSH] Optional dependency 'web-push' not installed in container node_modules yet. Dynamic Push API disabled.`);
}

const DEFAULT_VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BLw0vCLr34eFOA9DPxTjuxAvWRIX17QYZAKC2e1q7pCeftG_Br0o5KIRjl643rXqSAEgCey60iaX-aW4T7cFyeY';
const DEFAULT_VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'cOTcXWVCQ67Fe-vGSC2KT67Jf4f-USQ2qAJLTujI0Mo';

if (webPush) {
  try {
    webPush.setVapidDetails(
      'mailto:support@tormag.kz',
      DEFAULT_VAPID_PUBLIC,
      DEFAULT_VAPID_PRIVATE
    );
    logger.info('[WEB PUSH] VAPID details initialized successfully.');
  } catch (e) {
    logger.warn(`[WEB PUSH] VAPID initialization error: ${e.message}`);
  }
}

const SUB_FILE = path.join(process.cwd(), 'uploads', 'push_subscriptions.json');

const loadSubscriptions = () => {
  try {
    if (fs.existsSync(SUB_FILE)) {
      const data = fs.readFileSync(SUB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      const map = new Map();
      for (const [k, v] of Object.entries(parsed)) {
        const subObj = v.subscription || v;
        if (subObj && subObj.endpoint) {
          map.set(subObj.endpoint, { userId: v.userId || null, subscription: subObj });
        }
      }
      return map;
    }
  } catch (e) {
    logger.error(`[WEB PUSH] Error reading subscription file: ${e.message}`);
  }
  return new Map();
};

const saveSubscriptionsToDisk = (map) => {
  try {
    const dir = path.dirname(SUB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = Object.fromEntries(map);
    fs.writeFileSync(SUB_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    logger.error(`[WEB PUSH] Error saving subscription file: ${e.message}`);
  }
};

const subscriptions = loadSubscriptions();

export const getVapidPublicKey = () => DEFAULT_VAPID_PUBLIC;

export const saveSubscription = (userIdOrSession, subscription) => {
  if (!subscription || !subscription.endpoint) return null;

  const endpointKey = subscription.endpoint;

  // Purge any stale Apple APNs endpoints to prevent iOS multi-push throttling
  if (endpointKey.includes('apple.com')) {
    for (const [k] of subscriptions.entries()) {
      if (k.includes('apple.com') && k !== endpointKey) {
        subscriptions.delete(k);
      }
    }
  }

  const record = {
    userId: userIdOrSession || null,
    subscription,
    updatedAt: new Date().toISOString()
  };

  subscriptions.set(endpointKey, record);

  // Keep only recent unique active subscriptions to prevent APNs throttling
  if (subscriptions.size > 15) {
    const entries = Array.from(subscriptions.entries());
    entries.sort((a, b) => new Date(b[1].updatedAt || 0) - new Date(a[1].updatedAt || 0));
    subscriptions.clear();
    for (const [k, v] of entries.slice(0, 10)) {
      subscriptions.set(k, v);
    }
  }

  saveSubscriptionsToDisk(subscriptions);
  logger.info(`[WEB PUSH] Subscription saved for endpoint. Total active devices: ${subscriptions.size}`);
  return endpointKey;
};

export const sendPushNotification = async (subscription, payload, endpointKey = null) => {
  if (!webPush) {
    logger.warn(`[WEB PUSH] web-push module not available in container. Skipped sending push.`);
    return false;
  }
  try {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const options = {
      TTL: 86400,
      urgency: 'high'
    };
    await webPush.sendNotification(subscription, data, options);
    logger.info(`[WEB PUSH] Notification sent successfully to endpoint: ${subscription.endpoint.substring(0, 40)}...`);
    return true;
  } catch (err) {
    const status = err.statusCode;
    if (status === 400 || status === 404 || status === 410) {
      logger.info(`[WEB PUSH] Removing expired/invalid subscription endpoint (status ${status}).`);
      const key = endpointKey || subscription.endpoint;
      if (key && subscriptions.has(key)) {
        subscriptions.delete(key);
        saveSubscriptionsToDisk(subscriptions);
      }
    } else {
      logger.error(`[WEB PUSH] Failed to send push: ${err.message} (status: ${status})`);
    }
    return false;
  }
};

export const broadcastNotification = async (payload) => {
  if (!webPush) {
    logger.warn(`[WEB PUSH] web-push module not available in container. Broadcast skipped.`);
    return 0;
  }
  let count = 0;
  logger.info(`[WEB PUSH] Broadcasting notification to ${subscriptions.size} unique device(s)...`);
  for (const [endpointKey, record] of subscriptions.entries()) {
    const sub = record.subscription || record;
    const ok = await sendPushNotification(sub, payload, endpointKey);
    if (ok) count++;
  }
  return count;
};
