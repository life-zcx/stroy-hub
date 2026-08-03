/**
 * Parse [OPTIONS: Opt1 | Opt2] and [RECOMMEND: ID1, ID2] tags from AI text response
 */
export function parseAiResponse(rawText, catalogProducts = [], history = [], userMessage = '') {
  let replyText = rawText || '';
  let quickOptions = [];
  let recommendedProducts = [];

  // 1. Extract [RECOMMEND: ID1, ID2]
  const recommendMatch = replyText.match(/\[RECOMMEND:\s*([\d\s,]+)\]/i);
  if (recommendMatch) {
    const ids = recommendMatch[1]
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    if (ids.length > 0) {
      recommendedProducts = catalogProducts.filter(p => ids.includes(p.id));
    }

    replyText = replyText.replace(/\[RECOMMEND:\s*[\d\s,]+\]/gi, '').trim();
  }

  // 2. Extract [OPTIONS: Option1 | Option2]
  const optionsMatch = replyText.match(/\[OPTIONS:\s*([^\]]+)\]/i);
  if (optionsMatch) {
    quickOptions = optionsMatch[1]
      .split('|')
      .map(opt => opt.trim())
      .filter(Boolean);

    replyText = replyText.replace(/\[OPTIONS:\s*[^\]]+\]/gi, '').trim();
  }

  const isDialogueAdvanced = Array.isArray(history) && history.length >= 2;
  const isDemandingProducts = /товар|покажи|хватит|купить|вариант|дай|инструмент|сетевой|аккумулятор|любой/i.test(userMessage);

  const isQuestioning = replyText.includes('?') || /уточните|какую именно|где именно|для каких/i.test(replyText);

  // Smart Fallback Quiz Options only on INITIAL step
  if (quickOptions.length === 0 && isQuestioning && !isDialogueAdvanced && !isDemandingProducts) {
    const lowerText = replyText.toLowerCase();
    if (/краск|покрас|эмаль/i.test(lowerText)) {
      if (/подъезд/i.test(lowerText)) {
        quickOptions = ['Эмаль для цоколя/панелей', 'Моющаяся для стен', 'Для металлических перил'];
      } else {
        quickOptions = ['Внутренние стены', 'Моющаяся для кухни', 'Фасадная для улицы', 'Для потолка'];
      }
    } else if (/штукатур|выравн|стена|ротбанд/i.test(lowerText)) {
      quickOptions = ['Влажный санузел', 'Гипсовая для комнат', 'Фасад / Улица', 'Расчет мешков на м²'];
    } else if (/клей|плитк|кафель/i.test(lowerText)) {
      quickOptions = ['Для теплого пола', 'Для керамогранита', 'Внутренние работы', 'Влагостойкий'];
    } else if (/пол|наливн|стяжк/i.test(lowerText)) {
      quickOptions = ['Самонивелирующийся', 'Толстый слой (до 50мм)', 'Быстросохнущий'];
    } else if (/гипсокартон|гкл|профиль/i.test(lowerText)) {
      quickOptions = ['Влагостойкий (ГКЛВ)', 'Обычный стеновой', 'Потолочный'];
    }
  }

  // Suppress products ONLY on step 1 if options present and user hasn't specified details
  if (quickOptions.length > 0 && !isDialogueAdvanced && !isDemandingProducts && recommendedProducts.length === 0) {
    recommendedProducts = [];
  }

  // Append '✏️ Другое (свой вариант)' button if quickOptions present
  if (quickOptions.length > 0) {
    const hasOther = quickOptions.some(opt => /другое/i.test(opt));
    if (!hasOther) {
      quickOptions.push('✏️ Другое (свой вариант)');
    }
  }

  return {
    reply: replyText,
    recommendedProducts,
    quickOptions
  };
}
