import { recordAnalyticsEvent, recordPageView } from '../services/api';

const SESSION_KEY = 'tormag_analytics_session_id';
const DEDUPE_WINDOW_MS = 1500;
const recentEvents = new Map();
let analyticsContext = {};

export const getAnalyticsSessionId = () => {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const nextId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  localStorage.setItem(SESSION_KEY, nextId);
  return nextId;
};

export const setAnalyticsContext = (context = {}) => {
  analyticsContext = {
    ...analyticsContext,
    ...context,
  };
};

const buildDedupeKey = (type, payload = {}) => [
  type,
  payload.path || window.location.pathname,
  payload.productId || '',
  payload.orderId || '',
  payload.searchQuery || '',
].join('|');

const shouldSkipDuplicate = (key) => {
  const now = Date.now();
  const lastTrackedAt = recentEvents.get(key) || 0;

  if (now - lastTrackedAt < DEDUPE_WINDOW_MS) {
    return true;
  }

  recentEvents.set(key, now);
  return false;
};

export const trackEvent = (type, payload = {}) => {
  // Internal tracking is deactivated.
};
