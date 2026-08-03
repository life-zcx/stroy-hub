import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const BACKEND_API_URL = process.env.BACKEND_API_URL?.trim() || 'http://backend:5000';

// Helper to fetch products from monolithic Backend API over internal HTTP
async function fetchCatalogProducts() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/products?limit=100`);
    if (!res.ok) {
      console.error(`[AI SERVICE] Failed to fetch products from backend API. Status: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products || data.data || []);
  } catch (err) {
    console.error('[AI SERVICE] Error fetching catalog from backend API:', err.message);
    return [];
  }
}

// Fallback search when Gemini API Key is not configured or all Gemini models fail
async function generateFallbackResponse(message) {
  return {
    reply: 'Извините, сервис ИИ-консультаций временно недоступен. Вы можете задать вопрос нашему менеджеру по телефону или заказать обратный звонок.',
    recommendedProducts: []
  };
}

export const generateAiChatResponse = async ({ message, history = [] }) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Сообщение обязательно');
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';

  if (!apiKey) {
    console.log('[AI SERVICE] GEMINI_API_KEY is not configured. Using catalog fallback engine.');
    return await generateFallbackResponse(message);
  }

  // Multi-model candidate list for automatic retry if any model returns 404/429 or fails
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-pro-latest',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash-latest'
  ]
    .filter(Boolean)
    .map(m => m.trim().replace(/^models\//, ''));

  const uniqueModels = [...new Set(candidateModels)];

  try {
    // 1. Fetch catalog summary from Backend API
    const catalogProducts = await fetchCatalogProducts();

    const catalogContextStr = catalogProducts
      .map(p => `ID:${p.id} | ${p.name} | ${p.price} KZT | Категория: ${p.category} | Поставщик: ${p.supplier?.name || 'Tormag'}`)
      .join('\n');

    const systemInstructionText = `
Вы — "Тормаг AI", виртуальный эксперт-консультант по строительным материалам казахстанского интернет-магазина TORMAG.KZ (сайт tormag.kz).
Ваша цель — вежливо, профессионально и развернуто консультировать покупателей на русском языке по отделочным и строительным работам, расходу материалов на м², видам штукатурок, клея, красок.

Правила работы:
1. Будьте вежливы, используйте дружелюбный и профессиональный тон.
2. КРИТИЧЕСКИ ВАЖНО: Категорически не используйте символы ** (двойные звездочки) или другие знаки маркдауна. Пишите чистым красивым текстом без разметки **.
3. При расчетах площадей (м²) давайте точные математические рекомендации по нормам СНиП РК (например, расход гипсовой штукатурки ~8.5-10 кг/м² при слое 10 мм, наливного пола ~1.5 кг/м² на 1 мм).
4. Подбирайте и предлагайте товары из нашего склада (добавляя спец-тег [RECOMMEND: ID1, ID2] в самый конец ответа) ТОЛЬКО тогда, когда покупатель прямо просит подобрать товар, порекомендовать материал или спрашивает, какой конкретно товар купить. Если вопрос общий (приветствие, доставка, справочная информация), товары НЕ предлагайте.

--- КАТАЛОГ СКЛАДА TORMAG ---
${catalogContextStr}
--- КОНЕЦ КАТАЛОГА ---
`;

    // 2. Prepare conversation contents
    const contents = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h.role && h.text) {
          contents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(h.text) }]
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 3. Try Gemini models sequentially until one succeeds
    let replyText = '';
    let successfulModel = '';

    for (const modelCandidate of uniqueModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${apiKey}`;
        console.log(`[AI SERVICE] Trying Gemini model: "${modelCandidate}"...`);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstructionText }]
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            replyText = candidateText.trim();
            successfulModel = modelCandidate;
            console.log(`[AI SERVICE SUCCESS] Gemini Model "${modelCandidate}" succeeded!`);
            break;
          }
        } else {
          const errBody = await response.text();
          console.warn(`[GEMINI RETRY] Model "${modelCandidate}" HTTP ${response.status}: ${errBody.substring(0, 150)}`);
        }
      } catch (err) {
        console.warn(`[GEMINI RETRY] Model "${modelCandidate}" error: ${err.message}`);
      }
    }

    if (!replyText) {
      console.error('[AI SERVICE ERROR] All Gemini models failed or returned empty response. Using catalog fallback.');
      return await generateFallbackResponse(message);
    }

    // 4. Extract [RECOMMEND: ID1, ID2]
    const recommendMatch = replyText.match(/\[RECOMMEND:\s*([\d\s,]+)\]/i);
    let recommendedProducts = [];

    if (recommendMatch) {
      const ids = recommendMatch[1]
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));

      if (ids.length > 0) {
        recommendedProducts = catalogProducts.filter(p => ids.includes(p.id));
      }

      // Remove the recommendation tag from visible text
      replyText = replyText.replace(/\[RECOMMEND:\s*[\d\s,]+\]/gi, '').trim();
    }

    const result = {
      reply: replyText,
      recommendedProducts
    };

    // Non-blocking logging to PostgreSQL DB
    fetch(`${BACKEND_API_URL}/api/ai-logs/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        reply: replyText,
        recommendedProdIds: recommendedProducts.map(p => p.id)
      })
    }).catch(e => console.warn('[AI DB LOG WARN]', e.message));

    return result;
  } catch (error) {
    console.error('[AI SERVICE ERROR] Exception during response generation:', error);
    return await generateFallbackResponse(message);
  }
};
