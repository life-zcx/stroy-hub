import dotenv from 'dotenv';
import path from 'path';
import { fetchCatalogProducts, fetchSystemSettings, logAiResponseToDb } from './backendCatalogService.js';
import { buildSystemInstruction, formatHistoryContents } from './promptBuilder.js';
import { generateContentWithFallback } from './geminiClient.js';
import { parseAiResponse } from '../parsers/responseParser.js';
import { rankProductsByVectorSimilarity } from './embeddingService.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// --- Глобальные переменные для кэша ---
let catalogCache = null;
let settingsCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // Кэш живет 30 минут (в миллисекундах)

export function resetAiCatalogCache() {
  catalogCache = null;
  settingsCache = null;
  lastCacheTime = 0;
  console.log('[AI SERVICE] Catalog cache cleared via reset endpoint.');
}
// -------------------------------------------------

async function generateFallbackResponse() {
  return {
    reply: 'Извините, сервис ИИ-консультаций временно недоступен. Вы можете задать вопрос нашему менеджеру по телефону или заказать обратный звонок.',
    recommendedProducts: [],
    quickOptions: []
  };
}

export const generateAiChatResponse = async ({ message, history = [] }) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Сообщение обязательно');
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';

  if (!apiKey) {
    console.log('[AI SERVICE] GEMINI_API_KEY is not configured. Using catalog fallback engine.');
    return await generateFallbackResponse();
  }

  try {
    const now = Date.now();

    // --- Логика кэширования ---
    // Если кэш пустой или устарел (прошло больше 30 минут), скачиваем данные из БД
    if (!catalogCache || !settingsCache || (now - lastCacheTime > CACHE_TTL)) {
      console.log('[AI SERVICE] Обновление кэша каталога и настроек...');
      const [fetchedProducts, fetchedSettings] = await Promise.all([
        fetchCatalogProducts(),
        fetchSystemSettings()
      ]);
      catalogCache = fetchedProducts;
      settingsCache = fetchedSettings;
      lastCacheTime = now;
    }

    // Берем данные из кэша (это происходит мгновенно, без запроса к БД)
    const catalogProducts = catalogCache;
    const siteSettings = settingsCache;
    // ---------------------------------------

    // Собираем весь текст диалога (история + текущее сообщение)
    const fullDialogText = history.map(h => h.text).join(' ') + ' ' + message;

    // Векторное ранжирование товаров по сходству эмбеддингов
    const finalCatalogForAi = rankProductsByVectorSimilarity(fullDialogText, catalogProducts, 20);

    // Build system instruction
    const systemInstruction = buildSystemInstruction({
      message,
      catalogProducts: finalCatalogForAi,
      siteSettings,
      history
    });

    const contents = formatHistoryContents(history, message);

    // Call Gemini API
    const rawReplyText = await generateContentWithFallback({
      systemInstruction,
      contents,
      apiKey
    });

    if (!rawReplyText) {
      console.error('[AI SERVICE ERROR] All Gemini models failed. Using fallback response.');
      return await generateFallbackResponse();
    }

    // Parse output tags
    const result = parseAiResponse(rawReplyText, catalogProducts, history, message);

    // Non-blocking logging
    logAiResponseToDb({
      message,
      replyText: result.reply,
      recommendedProducts: result.recommendedProducts
    }).catch(err => console.error('[AI DB LOG ERROR]', err));

    return result;
  } catch (error) {
    console.error('[AI SERVICE ERROR] Exception during response generation:', error);
    return await generateFallbackResponse();
  }
};