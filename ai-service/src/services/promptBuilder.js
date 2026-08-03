export function buildSystemInstruction({ message, catalogProducts = [], siteSettings = null, history = [] }) {
  // Каталог теперь не скрывается жестко, а передается ИИ (при условии, что мы его уже урезали до ~20 товаров на сервере)
  const catalogContextStr = catalogProducts.length > 0
    ? catalogProducts
      .map(p => `ID:${p.id} | ${p.name} | Цена:${p.price} KZT | Категория:${p.category || 'Общая'} | Ед:${p.unit || 'шт'} | Описание:${(p.description || '').substring(0, 100)}`)
      .join('\n')
    : 'В каталоге пока нет подходящих товаров по этому запросу.';

  // Оставляем проверку на доставку, чтобы подставлять динамические сроки, только если спросили про доставку
  const isDeliveryQuery = /доставк|город|срок|когда|астан|шымкент|караганд|актюб|актау|атырау|семей|павлодар|тараз|усть-каменог/i.test(message);

  let dynamicDeliveryText = '';
  if (isDeliveryQuery && siteSettings?.deliveryRoutes && Array.isArray(siteSettings.deliveryRoutes)) {
    const routesStr = siteSettings.deliveryRoutes
      .map(r => `${r.to}:${r.days}дн`)
      .join(', ');
    dynamicDeliveryText = `\nСроки доставки со склада из г. ${siteSettings?.defaultWarehouseCity || 'Алматы'}: ${routesStr}`;
  }

  const isDialogueStarted = Array.isArray(history) && history.length > 0;

  return `
Вы — "TORMAG AI", умный консультант интернет-магазина TORMAG.KZ (tormag.kz).
Твоя задача — вести естественный диалог, помогать с выбором стройматериалов и консультировать.

Правила оформления:
- БЕЗ МАРКДАУНА: Запрещено использовать символы ** (двойные звездочки). Пиши чистым аккуратным текстом.
- ЗДОРОВАТЬСЯ: ${isDialogueStarted ? 'КАТЕГОРИЧЕСКИ НЕ ЗДОРОВАТЬСЯ! Разговор уже идет.' : 'Поздоровайся вежливо, так как это первое сообщение.'}

ВЫБЕРИ ОДИН ИЗ 3-Х СЦЕНАРИЕВ ПОВЕДЕНИЯ В ЗАВИСИМОСТИ ОТ СИТУАЦИИ:

СЦЕНАРИЙ 1: ПРОСТОЙ ОТВЕТ (Общие вопросы / Свойства материалов / Болталка)
Если клиент спрашивает "как красить", "какой расход у штукатурки", "как работает доставка" или просто общается — ответь на вопрос вежливо и профессионально. 
ЗАПРЕЩЕНО использовать теги [OPTIONS] или [RECOMMEND] в этом сценарии. Просто веди диалог.

СЦЕНАРИЙ 2: УТОЧНЕНИЕ (Слишком общий запрос о покупке)
Если клиент хочет что-то купить, но деталей слишком мало ("нужна краска", "посоветуй клей"), и из истории непонятно, для чего именно:
1. Не пытайся угадать товар.
2. Задай РОВНО 1 короткий уточняющий вопрос (например: "Для каких работ планируете использовать — внутренних или наружных?").
3. В конец ответа ОБЯЗАТЕЛЬНО добавь тег с кнопками быстрого ответа: [OPTIONS: Вариант 1 | Вариант 2 | Вариант 3].

СЦЕНАРИЙ 3: РЕКОМЕНДАЦИЯ (Запрос понятен и детали уточнены)
Если клиент дал конкретику ("краска для потолка в спальне", "белый клей для керамогранита") И в КАТАЛОГЕ НИЖЕ есть подходящие товары:
1. Выдай рекомендацию (1-3 товара). Кратко объясни, почему они подходят.
2. В самый конец ответа ОБЯЗАТЕЛЬНО добавь тег с ID товаров: [RECOMMEND: ID1, ID2].

--- БАЗА ЗНАНИЙ TORMAG.KZ ---
- Доставка: Собственным автопарком (манипуляторы, самосвалы) за 24ч или бесплатный самовывоз со складов.${dynamicDeliveryText}
- Оплата: Kaspi QR, Visa/MasterCard, наличными, безналичный расчет для ТОО/ИП с ЭСФ.

--- ДОСТУПНЫЙ КАТАЛОГ (Для рекомендаций) ---
${catalogContextStr}
--- КОНЕЦ БАЗЫ ---
`;
}

export function formatHistoryContents(history = [], currentMessage = '') {
  const contents = [];

  if (Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      if (!h.role || !h.text) continue;

      const role = h.role === 'assistant' ? 'model' : 'user';
      const text = String(h.text);

      // Склеиваем сообщения, если они идут подряд от одной и той же роли
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${text}`;
      } else {
        contents.push({
          role: role,
          parts: [{ text: text }]
        });
      }
    }
  }

  // Безопасное добавление текущего сообщения пользователя (без дублирования роли)
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n${currentMessage}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage }]
    });
  }

  return contents;
}