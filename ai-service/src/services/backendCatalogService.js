const BACKEND_API_URL = process.env.BACKEND_API_URL?.trim() || 'http://backend:5000';
const INTERNAL_SECRET = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET || 'tormag_internal_secret';

export async function fetchCatalogProducts() {
  try {
    let res = await fetch(`${BACKEND_API_URL}/api/products/ai-catalog`);
    if (!res.ok) {
      console.warn(`[AI SERVICE] /api/products/ai-catalog returned ${res.status}. Falling back to standard catalog endpoint...`);
      res = await fetch(`${BACKEND_API_URL}/api/products?limit=200`);
    }
    if (!res.ok) {
      console.error(`[AI SERVICE] Failed to fetch catalog. Status: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const products = Array.isArray(data) ? data : (data.products || data.data || []);
    console.log(`[AI SERVICE] Successfully loaded ${products.length} products into AI catalog cache.`);
    return products;
  } catch (err) {
    console.error('[AI SERVICE] Error fetching catalog from backend API:', err.message);
    return [];
  }
}

export async function fetchSystemSettings() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/settings`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[AI SERVICE] Error fetching system settings:', err.message);
    return null;
  }
}

export async function logAiResponseToDb({ message, replyText, recommendedProducts }) {
  fetch(`${BACKEND_API_URL}/api/ai-logs/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET
    },
    body: JSON.stringify({
      prompt: message,
      reply: replyText,
      recommendedProdIds: (recommendedProducts || []).map(p => p.id)
    })
  }).catch(e => console.warn('[AI DB LOG WARN]', e.message));
}
