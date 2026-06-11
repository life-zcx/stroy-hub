import prisma from '../config/db.js';

export const getProductOg = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid product ID');
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    const title = `${product.name} — Купить в TORMAG`;
    const description = product.description 
      ? product.description.substring(0, 160) + '...'
      : `Купить ${product.name} по цене ${product.price} KZT в интернет-магазине TORMAG. Доставка по Алматы и области, кэшбэк и бонусы.`;
    const imageUrl = product.image || 'https://tormag.kz/tormag.png';

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="https://tormag.kz/product/${id}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="TORMAG">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
</head>
<body>
  <script>
    window.location.href = "/product/${id}";
  </script>
</body>
</html>`;

    res.header('Content-Type', 'text/html');
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

    const title = category 
      ? `${category.name} — Купить стройматериалы в TORMAG`
      : "Каталог стройматериалов — TORMAG";
      
    const description = category
      ? `Большой выбор строительных и отделочных материалов в категории "${category.name}" на платформе TORMAG. Низкие цены, оптовые поставки, быстрая доставка.`
      : "Каталог строительных и отделочных материалов TORMAG. Широкий ассортимент с доставкой по Алматы и области.";

    const imageUrl = 'https://tormag.kz/tormag.png';

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="https://tormag.kz/catalog/${slug}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="TORMAG">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
</head>
<body>
  <script>
    window.location.href = "/catalog/${slug}";
  </script>
</body>
</html>`;

    res.header('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('[OG CATALOG ERROR]', error);
    res.status(500).send('Internal Server Error');
  }
};
