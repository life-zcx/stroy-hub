import { generateAiChatResponse, resetAiCatalogCache } from '../services/aiService.js';
import { parseEstimateFromImageOrPdf } from '../services/estimateOcrService.js';

export const handleAiChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Пожалуйста, введите сообщение' });
    }

    const result = await generateAiChatResponse({
      message: message.trim(),
      history: Array.isArray(history) ? history : []
    });

    res.json({
      reply: result.reply,
      recommendedProducts: result.recommendedProducts || [],
      quickOptions: result.quickOptions || []
    });
  } catch (error) {
    console.error('[AI CONTROLLER ERROR]', error);
    res.status(500).json({ error: 'Ошибка обработки сообщения ИИ-сервисом' });
  }
};

export const handleResetCache = async (req, res) => {
  try {
    resetAiCatalogCache();
    res.json({ success: true, message: 'Кэш каталога ИИ-сервиса сброшен' });
  } catch (error) {
    console.error('[AI RESET CACHE ERROR]', error);
    res.status(500).json({ error: 'Ошибка сброса кэша ИИ' });
  }
};

export const handleParseEstimateOcr = async (req, res) => {
  let buffer = null;
  try {
    const { fileBufferBase64, mimeType, fileName } = req.body || {};
    if (!fileBufferBase64 || !mimeType) {
      return res.status(400).json({ error: 'Файл (fileBufferBase64) и MIME-тип (mimeType) обязательны' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!allowedMimes.some(m => mimeType.toLowerCase().startsWith(m))) {
      return res.status(400).json({ error: `Неподдерживаемый тип файла (${mimeType}). Разрешены изображения (JPG, PNG, WEBP) и PDF.` });
    }

    // Limit max base64 size to ~25MB (approx 33MB base64 string) to prevent Node.js RAM exhaustion
    if (typeof fileBufferBase64 === 'string' && fileBufferBase64.length > 35 * 1024 * 1024) {
      return res.status(400).json({ error: 'Размер файла сметы превышает максимальный допустимый лимит (25 МБ).' });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY не настроен в ai-service' });
    }

    buffer = Buffer.from(fileBufferBase64, 'base64');
    console.log(`[AI OCR CONTROLLER] Processing file "${fileName || 'estimate'}" (${mimeType}, ${buffer.length} bytes)...`);

    const items = await parseEstimateFromImageOrPdf({
      buffer,
      mimeType,
      apiKey
    });

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('[AI OCR CONTROLLER ERROR]', error);
    res.status(500).json({ error: 'Ошибка распознавания сметы: ' + error.message });
  } finally {
    // Explicitly release buffer memory reference for garbage collection
    buffer = null;
  }
};
