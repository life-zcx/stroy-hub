import prisma from '../config/db.js';

export const getDynamicSitemap = async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        select: { id: true }
      }),
      prisma.category.findMany({
        select: { slug: true }
      })
    ]);

    const staticPages = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: 'services', changefreq: 'weekly', priority: '0.8' },
      { path: 'partners', changefreq: 'weekly', priority: '0.7' },
      { path: 'promotions', changefreq: 'daily', priority: '0.8' },
      { path: 'about', changefreq: 'monthly', priority: '0.6' },
      { path: 'delivery', changefreq: 'monthly', priority: '0.6' },
      { path: 'advisor', changefreq: 'weekly', priority: '0.7' },
      { path: 'faq', changefreq: 'monthly', priority: '0.5' },
      { path: 'warranty', changefreq: 'monthly', priority: '0.5' },
      { path: 'payment-terms', changefreq: 'monthly', priority: '0.5' },
      { path: 'delivery-terms', changefreq: 'monthly', priority: '0.5' },
      { path: 'requisites', changefreq: 'monthly', priority: '0.5' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 1. Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>https://tormag.kz/${page.path}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // 2. Dynamic Category pages
    for (const cat of categories) {
      if (cat.slug && cat.slug !== 'all') {
        xml += `  <url>\n`;
        xml += `    <loc>https://tormag.kz/catalog/${cat.slug}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // 3. Dynamic Product pages
    for (const prod of products) {
      xml += `  <url>\n`;
      xml += `    <loc>https://tormag.kz/product/${prod.id}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += '</urlset>\n';

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('[SITEMAP ERROR] Failed to generate sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};
