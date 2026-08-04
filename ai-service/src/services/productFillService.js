import dotenv from 'dotenv';
import path from 'path';
import { generateContentWithFallback } from './geminiClient.js';
import { buildProductFillSystemInstruction, buildProductFillUserContent } from '../prompts/productFillPrompt.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

function sanitizeJsonStringLiterals(str) {
  let inString = false;
  let escaped = false;
  let out = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
      } else if (ch === '\\') {
        out += ch;
        escaped = true;
      } else if (ch === '"') {
        out += ch;
        inString = false;
      } else if (ch === '\n') {
        out += '\\n';
      } else if (ch === '\r') {
        out += '\\r';
      } else if (ch === '\t') {
        out += '\\t';
      } else {
        out += ch;
      }
    } else {
      if (ch === '"') {
        inString = true;
      }
      out += ch;
    }
  }
  return out;
}

function parseJsonFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  cleaned = cleaned.trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Sanitize unescaped newlines/tabs inside string literals
    const sanitized = sanitizeJsonStringLiterals(cleaned);
    try {
      return JSON.parse(sanitized);
    } catch (sanitizedErr) {
      // Extract between first { and last }
      const firstBrace = sanitized.indexOf('{');
      const lastBrace = sanitized.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = sanitized.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(jsonCandidate);
        } catch (innerErr) {
          console.warn('[PRODUCT FILL SERVICE] Failed to parse extracted JSON substring:', innerErr.message);
        }
      }
      console.warn('[PRODUCT FILL SERVICE] Failed to parse raw AI text to JSON:', err.message);
      return null;
    }
  }
}

function createFallbackCard(productName) {
  return {
    seo_title: productName || 'Товар без названия',
    category: 'Общая',
    description: 'Качественный строительный материал для внутренних и наружных работ.',
    details: 'Материал предназначен для профессионального и бытового использования. Отличается высокой надежностью, долговечностью и удобством применения в соответствии со строительными стандартами.',
    specifications: {
      "Назначение": "Строительно-отделочные работы",
      "Материал": "Стандартный состав"
    },
    usage: '1. Подготовить основание или рабочую зону.\n2. Смонтировать или нанести материал по технологии.\n3. Закрепить и защитить от внешней среды при необходимости.',
    attributes: {
      "Назначение": "Строительно-отделочные работы"
    },
    flags: {
      needs_manual_review: true
    }
  };
}

export async function fillProductCard({ productName }) {
  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    throw new Error('Название товара (productName) является обязательным полем.');
  }

  const cleanName = productName.trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';

  if (!apiKey) {
    console.warn('[PRODUCT FILL SERVICE] GEMINI_API_KEY is not configured. Returning fallback card.');
    return createFallbackCard(cleanName);
  }

  const systemInstruction = buildProductFillSystemInstruction();
  const contents = buildProductFillUserContent(cleanName);

  const rawText = await generateContentWithFallback({
    systemInstruction,
    contents,
    apiKey
  });

  if (!rawText) {
    console.warn('[PRODUCT FILL SERVICE] No response text received from Gemini models.');
    return createFallbackCard(cleanName);
  }

  const parsedCard = parseJsonFromText(rawText);

  if (!parsedCard) {
    console.warn('[PRODUCT FILL SERVICE] AI returned non-JSON response. Returning fallback.');
    return createFallbackCard(cleanName);
  }

  const rawSpecs = parsedCard.specifications || parsedCard.attributes || {};

  return {
    seo_title: parsedCard.seo_title || cleanName,
    category: parsedCard.category || 'Общая',
    description: parsedCard.description || '',
    details: parsedCard.details || parsedCard.description || '',
    specifications: typeof rawSpecs === 'object' && rawSpecs !== null ? rawSpecs : {},
    attributes: typeof rawSpecs === 'object' && rawSpecs !== null ? rawSpecs : {},
    usage: parsedCard.usage || '',
    flags: {
      needs_manual_review: Boolean(parsedCard.flags?.needs_manual_review ?? false)
    }
  };
}
