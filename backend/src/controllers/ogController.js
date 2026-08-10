import prisma from '../config/db.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const getProductOg = async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).send('Invalid product identifier');
    }

    const parsedId = parseInt(rawId, 10);
    const isNumeric = !isNaN(parsedId) && String(parsedId) === String(rawId);

    let product = await prisma.product.findFirst({
      where: isNumeric ? { id: parsedId } : { slug: rawId },
      include: {
        supplier: { select: { name: true } },
        categoryRelation: { select: { name: true, slug: true } }
      }
    });

    if (!product && isNumeric) {
      product = await prisma.product.findFirst({
        where: { slug: rawId },
        include: {
          supplier: { select: { name: true } },
          categoryRelation: { select: { name: true, slug: true } }
        }
      });
    }

    if (!product) {
      return res.status(404).send('Product not found');
    }

    const title = `${product.name} — Купить по цене ${product.price} KZT в Алматы | TORMAG`;
    const description = product.description 
      ? product.description.substring(0, 250) + '...'
      : `Купить ${product.name} по выгодной цене ${product.price} KZT в строительном интернет-магазине TORMAG. Доставка по Алматы и Казахстану, гарантия качества.`;
    const imageUrl = product.image || 'https://tormag.kz/tormag.png';
    const brandName = product.supplier?.name || 'TORMAG';
    const categoryName = product.categoryRelation?.name || product.category || 'Стройматериалы';
    const categorySlug = product.categoryRelation?.slug || '';
    const productIdentifier = product.slug || product.id || rawId;

    const schemaJson = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [imageUrl, ...(product.images || [])].filter(Boolean),
      "description": product.description || description,
      "sku": product.article || `PRD-${product.id}`,
      "brand": {
        "@type": "Brand",
        "name": brandName
      },
      "offers": {
        "@type": "Offer",
        "url": `https://tormag.kz/product/${productIdentifier}`,
        "priceCurrency": "KZT",
        "price": product.price,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "TORMAG"
        }
      }
    };

    if (product.rating && product.reviews > 0) {
      schemaJson["aggregateRating"] = {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviews
      };
    }

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(`${product.name}, ${categoryName}, купить ${product.name} алматы, стройматериалы алматы, тормаг`)}">
  <link rel="canonical" href="https://tormag.kz/product/${productIdentifier}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="https://tormag.kz/product/${productIdentifier}">
  <meta property="og:site_name" content="TORMAG">
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="KZT">
  
  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    ${JSON.stringify(schemaJson)}
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333;">
  <header style="margin-bottom: 20px;">
    <nav style="font-size: 0.9rem;">
      <a href="https://tormag.kz/" style="color: #059669; text-decoration: none; font-weight: bold;">Главная TORMAG</a> &gt; 
      <a href="https://tormag.kz/catalog/${categorySlug}" style="color: #059669; text-decoration: none;">${escapeHtml(categoryName)}</a> &gt; 
      <span>${escapeHtml(product.name)}</span>
    </nav>
  </header>
  
  <main>
    <article>
      <h1 style="font-size: 2rem; color: #111827; margin-top: 10px;">${escapeHtml(product.name)}</h1>
      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px;">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" style="max-width: 350px; width: 100%; height: auto; border-radius: 8px; object-fit: cover;" />
        <div style="flex: 1; min-width: 280px;">
          <div style="font-size: 1.8rem; font-weight: bold; color: #059669; margin-bottom: 10px;">
            ${product.price.toLocaleString('ru-RU')} KZT
            ${product.oldPrice ? `<span style="text-decoration: line-through; color: #9ca3af; font-size: 1.2rem; margin-left: 10px;">${product.oldPrice.toLocaleString('ru-RU')} KZT</span>` : ''}
          </div>
          <p><strong>Категория:</strong> <a href="https://tormag.kz/catalog/${categorySlug}" style="color: #059669;">${escapeHtml(categoryName)}</a></p>
          <p><strong>Поставщик / Бренд:</strong> ${escapeHtml(brandName)}</p>
          ${product.article ? `<p><strong>Артикул:</strong> ${escapeHtml(product.article)}</p>` : ''}
          ${product.bulkDiscount ? `<p><strong>Оптовые поставки:</strong> ${escapeHtml(product.bulkDiscount)}</p>` : ''}
          <div style="margin-top: 20px;">
            <a href="https://tormag.kz/product/${productIdentifier}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Перейти к покупке на TORMAG.KZ</a>
          </div>
        </div>
      </div>

      ${product.description ? `
      <section style="margin-top: 30px;">
        <h2 style="font-size: 1.4rem;">Описание товара</h2>
        <p>${escapeHtml(product.description)}</p>
      </section>` : ''}

      ${product.specifications ? `
      <section style="margin-top: 20px;">
        <h2 style="font-size: 1.4rem;">Характеристики</h2>
        <p>${escapeHtml(product.specifications)}</p>
      </section>` : ''}
    </article>
  </main>

  <footer style="margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 0.9rem;">
    <p>&copy; ${new Date().getFullYear()} TORMAG — Строительные и отделочные материалы с доставкой по Алматы и Казахстану.</p>
  </footer>
</body>
</html>`;

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('[OG PRODUCT ERROR]', error);
    res.status(500).send('Internal Server Error');
  }
};

export const getCatalogOg = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug }
    });

    const products = await prisma.product.findMany({
      where: category ? { categoryId: category.id } : {},
      take: 30,
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        description: true
      }
    });

    const title = category 
      ? `${category.name} — Купить стройматериалы в Алматы по оптовым ценам | TORMAG`
      : "Каталог строительных материалов — Купить в интернет-магазине TORMAG";
      
    const description = category
      ? `Огромный выбор строительных и отделочных материалов в категории "${category.name}" на платформе TORMAG. Выгодные цены складов, прямые поставки, быстрая доставка по Алматы.`
      : "Каталог строительных и отделочных материалов TORMAG. Сухие смеси, краски, инструменты, пиломатериалы с доставкой по Алматы.";

    const imageUrl = category?.image || 'https://tormag.kz/tormag.png';

    const itemListElement = products.map((prod, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://tormag.kz/product/${prod.id}`,
      "name": prod.name
    }));

    const schemaJson = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": category ? category.name : "Каталог товаров",
      "description": description,
      "url": `https://tormag.kz/catalog/${slug}`,
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": itemListElement
      }
    };

    let productsHtml = products.map(prod => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background-color: #fff;">
        <a href="https://tormag.kz/product/${prod.id}" style="text-decoration: none; color: inherit;">
          <img src="${escapeHtml(prod.image || 'https://tormag.kz/tormag.png')}" alt="${escapeHtml(prod.name)}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px;" />
          <h3 style="font-size: 1.1rem; margin: 10px 0 5px 0; color: #111827;">${escapeHtml(prod.name)}</h3>
          <div style="font-weight: bold; color: #059669; font-size: 1.2rem;">${prod.price.toLocaleString('ru-RU')} KZT</div>
        </a>
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(`${category?.name || 'каталог'}, стройматериалы алматы, купить ${category?.name || ''} алматы, тормаг`)}">
  <link rel="canonical" href="https://tormag.kz/catalog/${slug}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="https://tormag.kz/catalog/${slug}">
  <meta property="og:site_name" content="TORMAG">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    ${JSON.stringify(schemaJson)}
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 1100px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9fafb;">
  <header style="margin-bottom: 20px;">
    <nav style="font-size: 0.9rem;">
      <a href="https://tormag.kz/" style="color: #059669; text-decoration: none; font-weight: bold;">Главная TORMAG</a> &gt; 
      <a href="https://tormag.kz/catalog/all" style="color: #059669; text-decoration: none;">Каталог</a> &gt; 
      <span>${escapeHtml(category?.name || 'Все товары')}</span>
    </nav>
  </header>

  <main>
    <h1 style="font-size: 2rem; color: #111827;">${escapeHtml(category?.name || 'Каталог строительных материалов')}</h1>
    <p style="color: #4b5563; font-size: 1.1rem;">${escapeHtml(description)}</p>

    <section style="margin-top: 30px;">
      <h2 style="font-size: 1.5rem; margin-bottom: 20px;">Товары в категории</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
        ${productsHtml || '<p>Товары загружаются...</p>'}
      </div>
    </section>
  </main>

  <footer style="margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 0.9rem;">
    <p>&copy; ${new Date().getFullYear()} TORMAG — Качественные строительные материалы с доставкой в Алматы.</p>
  </footer>
</body>
</html>`;

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('[OG CATALOG ERROR]', error);
    res.status(500).send('Internal Server Error');
  }
};

export const getStaticPageOg = async (req, res) => {
  try {
    const { page } = req.params;

    const pagesData = {
      services: {
        title: "Строительные услуги и снабжение объектов в Алматы — TORMAG",
        description: "Услуги комплексного снабжения строительных объектов, расчёта смет, быстрой логистики и технического консультанта от платформы TORMAG.",
        h1: "Строительные услуги и комплектация объектов",
        content: "Платформа TORMAG предоставляет полный спектр услуг для строительных компаний, бригад и частных застройщиков: оптовые поставки строительных материалов, автоматизированный расчёт смет, личный менеджер снабжения, шеф-монтаж и спецавтотранспорт."
      },
      about: {
        title: "О компании TORMAG — Строительная платформа нового поколения",
        description: "Узнайте историю, миссию и преимущества строительной интернет-платформы TORMAG в Алматы. Прямые контракты с производителями и дилерами.",
        h1: "О платформе TORMAG",
        content: "TORMAG — это современные цифровые решения в сфере строительства и ремонта. Мы соединяем оптовые склады, производителей стройматериалов и покупателей в одной экосистеме с прозрачным ценообразованием и гарантией доставки."
      },
      delivery: {
        title: "Доставка и оплата строительных материалов в Алматы — TORMAG",
        description: "Условия, зоны и стоимость быстрой доставки стройматериалов по Алматы и Алматинской области. Оплата через Kaspi QR, банковской картой или наличными при получении.",
        h1: "Доставка и оплата",
        content: "Мы осуществляем оперативную доставку строительных материалов собственным автопарком (газели, манипуляторы, длинномеры). Доступны гибкие варианты оплаты и разгрузки на объекте."
      },
      promotions: {
        title: "Акции, скидки и спецпредложения на стройматериалы — TORMAG",
        description: "Актуальные промокоды, скидки от объёма и распродажи строительных материалов в интернет-магазине TORMAG.",
        h1: "Акции и специальные предложения",
        content: "Покупайте качественные строительные материалы с дополнительной выгодой! Смотрите текущие скидки, акционные наборы и получайте кэшбэк за каждую покупку."
      },
      partners: {
        title: "Наши бренды и партнеры-производители — TORMAG",
        description: "Официальные дистрибьюторы и бренды-партнёры строительной платформы TORMAG: Knauf, Bosch, Ceresit, Alina и многие другие.",
        h1: "Официальные бренды и партнеры",
        content: "TORMAG сотрудничает напрямую с официальными дистрибьюторами строительных брендов. Гарантируем 100% оригинальность продукции и заводские цены."
      },
      faq: {
        title: "Вопросы и ответы (FAQ) — Строительный интернет-магазин TORMAG",
        description: "Ответы на часто задаваемые вопросы о заказе, возврате, доставке и бонусной программе TORMAG.",
        h1: "Часто задаваемые вопросы",
        content: "Здесь собраны ответы на популярные вопросы о том, как сделать заказ, оформить доставку, использовать промокод или вернуть товар."
      },
      warranty: {
        title: "Гарантия на строительные материалы и оборудование — TORMAG",
        description: "Информация о гарантии качества, сертификатах соответствия и возврате товаров в TORMAG.",
        h1: "Гарантия качества",
        content: "Вся продукция в магазине TORMAG проходит обязательный контроль качества и имеет сертификаты производителей. Мы гарантируем полный возврат или замену в случае дефекта."
      },
      'payment-terms': {
        title: "Условия оплаты — TORMAG",
        description: "Удобные способы оплаты стройматериалов: Kaspi, безналичный расчёт для юрлиц, оплата при получении.",
        h1: "Условия оплаты",
        content: "Оплачивайте покупки удобным способом. Доступна онлайн-оплата, Kaspi QR, а также работа по договору с НДС для юридических лиц."
      },
      'delivery-terms': {
        title: "Правила и условия доставки — TORMAG",
        description: "Правила приёмки, разгрузки и подъёма на этаж строительных материалов от TORMAG.",
        h1: "Правила доставки",
        content: "Ознакомьтесь с правилами приёмки грузов, работы грузчиков и транспортировки негабаритных стройматериалов."
      },
      requisites: {
        title: "Реквизиты компании TORMAG",
        description: "Официальные реквизиты, БИН, юридический адрес и контакты платформы TORMAG.",
        h1: "Реквизиты компании",
        content: "Банковские реквизиты, юридические данные и контакты для заключения договоров поставки."
      }
    };

    const pageData = pagesData[page] || {
      title: "TORMAG — Всё для стройки и ремонта в Алматы",
      description: "Строительная интернет-платформа TORMAG. Купить качественные стройматериалы с доставкой.",
      h1: "Строительная платформа TORMAG",
      content: "Добро пожаловать на платформу TORMAG. Широкий ассортимент товаров для ремонта и строительства по лучшим ценам."
    };

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageData.title)}</title>
  <meta name="description" content="${escapeHtml(pageData.description)}">
  <link rel="canonical" href="https://tormag.kz/${page}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(pageData.title)}">
  <meta property="og:description" content="${escapeHtml(pageData.description)}">
  <meta property="og:image" content="https://tormag.kz/tormag.png">
  <meta property="og:url" content="https://tormag.kz/${page}">
  <meta property="og:site_name" content="TORMAG">
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${escapeHtml(pageData.h1)}",
    "description": "${escapeHtml(pageData.description)}",
    "publisher": {
      "@type": "Organization",
      "name": "TORMAG",
      "logo": "https://tormag.kz/tormag.png"
    }
  }
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333;">
  <header style="margin-bottom: 20px;">
    <nav style="font-size: 0.9rem;">
      <a href="https://tormag.kz/" style="color: #059669; text-decoration: none; font-weight: bold;">Главная TORMAG</a> &gt; 
      <span>${escapeHtml(pageData.h1)}</span>
    </nav>
  </header>

  <main>
    <h1 style="font-size: 2rem; color: #111827;">${escapeHtml(pageData.h1)}</h1>
    <div style="font-size: 1.1rem; color: #374151; margin-top: 20px; background: #f9fafb; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <p>${escapeHtml(pageData.content)}</p>
    </div>
    
    <div style="margin-top: 30px;">
      <a href="https://tormag.kz/catalog/all" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Перейти в каталог стройматериалов</a>
    </div>
  </main>

  <footer style="margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 0.9rem;">
    <p>&copy; ${new Date().getFullYear()} TORMAG — Строительная платформа Казахстана.</p>
  </footer>
</body>
</html>`;

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('[OG STATIC PAGE ERROR]', error);
    res.status(500).send('Internal Server Error');
  }
};

