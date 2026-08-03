import prisma from '../config/db.js';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const getGoogleMerchantFeed = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        categoryRelation: true,
        supplier: true,
      },
    });

    const baseUrl = 'https://tormag.kz';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>TORMAG.KZ — Строительные материалы</title>\n`;
    xml += `    <link>${baseUrl}</link>\n`;
    xml += `    <description>Каталог товаров TORMAG.KZ для Google Merchant Center</description>\n`;

    for (const product of products) {
      const productUrl = `${baseUrl}/product/${product.slug || product.id}`;
      let imageUrl = product.image || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }

      const categoryName = product.categoryRelation?.name || product.category || 'Строительные материалы';

      xml += `    <item>\n`;
      xml += `      <g:id>${product.id}</g:id>\n`;
      xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`;
      xml += `      <g:description>${escapeXml(product.description || product.name)}</g:description>\n`;
      xml += `      <g:link>${escapeXml(productUrl)}</g:link>\n`;
      if (imageUrl) {
        xml += `      <g:image_link>${escapeXml(imageUrl)}</g:image_link>\n`;
      }
      xml += `      <g:condition>new</g:condition>\n`;
      xml += `      <g:availability>in_stock</g:availability>\n`;
      xml += `      <g:price>${product.price} KZT</g:price>\n`;
      xml += `      <g:brand>${escapeXml(product.supplier?.name || 'TORMAG')}</g:brand>\n`;
      xml += `      <g:product_type>${escapeXml(categoryName)}</g:product_type>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    console.error('[FEED ERROR] Failed to generate Google Merchant feed:', error);
    res.status(500).send('Error generating Google Merchant feed');
  }
};
