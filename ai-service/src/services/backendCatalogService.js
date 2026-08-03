const BACKEND_API_URL = process.env.BACKEND_API_URL?.trim() || 'http://backend:5000';

export async function fetchCatalogProducts() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/products?limit=100`);
    if (!res.ok) {
      console.error(`[AI SERVICE] Failed to fetch catalog. Status: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products || data.data || []);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: message,
      reply: replyText,
      recommendedProdIds: (recommendedProducts || []).map(p => p.id)
    })
  }).catch(e => console.warn('[AI DB LOG WARN]', e.message));
}
