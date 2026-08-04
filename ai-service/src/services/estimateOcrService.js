import { getCandidateModels } from '../config/models.js';

export async function parseEstimateFromImageOrPdf({ buffer, mimeType, apiKey }) {
  if (!buffer || !mimeType) {
    throw new Error('Файл и MIME-тип обязательны');
  }

  const base64Data = buffer.toString('base64');
  const models = getCandidateModels();

  const systemInstruction = `Ты — эксперт по обработке строительных смет и спецификаций TORMAG.
Твоя задача — проанализировать загруженное изображение или PDF-документ со списком строительных материалов, оборудования или сметой.
Извлеки наименования всех строительных товаров, их количество и единицу измерения (если указана).

Верни результат ИСКЛЮЧИТЕЛЬНО в формате JSON без каких-либо кавычек markdown или пояснений:
{
  "items": [
    {
      "name": "Наименование товара или материала",
      "quantity": 10,
      "unit": "шт"
    }
  ]
}

Правила:
1. "name" — чистое название товара/материала (без порядкового номера строки и цен).
2. "quantity" — числовое количество (по умолчанию 1, если не указано).
3. Пропускай итоговые строки ("Итого", "Всего", "В том числе НДС", названия разделов).
4. Если товары не найдены, верни {"items": []}.
`;

  const contents = [
    {
      role: 'user',
      parts: [
        { text: 'Распознай список стройматериалов со сметы и верни в формате JSON.' },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ]
    }
  ];

  let rawResponseText = '';

  for (const modelCandidate of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${apiKey}`;
      console.log(`[AI OCR SERVICE] Trying model "${modelCandidate}" for estimate recognition...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          rawResponseText = candidateText.trim();
          console.log(`[AI OCR SUCCESS] Model "${modelCandidate}" successfully recognized estimate!`);
          break;
        }
      } else {
        const errText = await response.text();
        console.warn(`[AI OCR RETRY] Model "${modelCandidate}" status ${response.status}: ${errText.substring(0, 150)}`);
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (err) {
      console.warn(`[AI OCR RETRY] Model "${modelCandidate}" error: ${err.message}`);
      await new Promise(r => setTimeout(r, 600));
    }
  }

  if (!rawResponseText) {
    throw new Error('Не удалось распознать смету с помощью ИИ Vision.');
  }

  let items = [];

  // Clean raw markdown and trailing commas
  let cleaned = rawResponseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/g, '')
    .trim();

  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && Array.isArray(parsed.items)) {
      items = parsed.items;
    } else if (Array.isArray(parsed)) {
      items = parsed;
    }
  } catch (parseErr) {
    console.warn('[AI OCR RECOVERY] Standard JSON.parse failed, running regex object extractor...', parseErr.message);

    // Fallback Regex Extractor for individual item objects
    const objectRegex = /\{\s*"name"\s*:\s*"([^"]+)"(?:\s*,\s*"quantity"\s*:\s*([0-9.]+))?(?:\s*,\s*"unit"\s*:\s*"([^"]*)")?[^\}]*\}/gi;
    let match;
    while ((match = objectRegex.exec(rawResponseText)) !== null) {
      items.push({
        name: match[1],
        quantity: match[2] ? parseFloat(match[2]) : 1,
        unit: match[3] || 'шт'
      });
    }

    if (items.length === 0) {
      const nameRegex = /"name"\s*:\s*"([^"]+)"/gi;
      let nMatch;
      while ((nMatch = nameRegex.exec(rawResponseText)) !== null) {
        items.push({
          name: nMatch[1],
          quantity: 1,
          unit: 'шт'
        });
      }
    }
  }

  return items.map(item => ({
    name: String(item.name || '').trim(),
    quantity: Math.max(1, Math.round(parseFloat(item.quantity) || 1)),
    unit: String(item.unit || 'шт').trim()
  })).filter(item => item.name.length >= 2);
}
