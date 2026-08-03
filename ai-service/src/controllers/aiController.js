import { generateAiChatResponse } from '../services/aiService.js';

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
