import { useEffect } from 'react';
import { getAnalyticsSessionId, setAnalyticsContext, trackEvent } from '../utils/analytics';
import { getPageHref } from '../utils/navigationHelper';

export default function SeoHeadManager({ currentPage, currentProductId, currentCategorySlug, currentOrderId, isCabinetPage, region }) {
  useEffect(() => {
    const pageTitles = {
      home: "TORMAG — Всё для стройки и ремонта",
      catalog: "TORMAG - Каталог стройматериалов",
      advisor: "TORMAG - Умный подбор стройматериалов",
      about: "TORMAG - О компании",
      delivery: "TORMAG - Доставка и оплата",
      services: "TORMAG - Строительные услуги",
      partners: "TORMAG - Наши партнеры",
      promotions: "TORMAG - Акции и скидки",
      favorites: "TORMAG - Избранные товары",
      orders: "TORMAG - Мои заказы",
      'my-promotions': "TORMAG - Мои промокоды",
      cashback: "TORMAG - Мой кешбэк",
      cabinet: "TORMAG - Личный кабинет",
      'cabinet/orders': "TORMAG - Мои заказы",
      'cabinet/promotions': "TORMAG - Мои промокоды",
      'cabinet/cashback': "TORMAG - Мой кешбэк",
      'cashback/history': "TORMAG - История транзакций",
      requisites: "TORMAG - Реквизиты компании",
      faq: "TORMAG - Вопрос-ответ",
      legal: "TORMAG - Юридическая информация",
      estimate: "TORMAG - Заказ по смете",
      product: "TORMAG - Просмотр товара",
      'payment-terms': "TORMAG - Условия оплаты",
      'delivery-terms': "TORMAG - Условия доставки",
      warranty: "TORMAG - Гарантия на товар",
      cart: "TORMAG - Корзина",
      'order-detail': "TORMAG - Детали заказа",
      changelog: "TORMAG - Обновления платформы"
    };

    const pageDescriptions = {
      home: "Строительная платформа TORMAG в Алматы. Огромный каталог стройматериалов, прямые оптовые поставки от дистрибьюторов, оперативная доставка и кэшбэк 3%.",
      catalog: "Каталог строительных и отделочных материалов TORMAG. Широкий ассортимент сухих смесей, красок, инструментов, крепежа с доставкой по Алматы.",
      advisor: "Умный калькулятор-подборщик строительных материалов под ваш бюджет и задачи от платформы TORMAG.",
      about: "Узнайте больше о строительной платформе TORMAG. Наша миссия, команда, ценности и преимущества работы с нами.",
      delivery: "Условия и сроки доставки строительных материалов по Алматы и области. Удобные способы оплаты, включая Kaspi QR.",
      services: "Услуги снабжения объектов, расчета смет, шеф-монтажа и специализированной логистики от платформы TORMAG.",
      partners: "Официальные дистрибьюторы и бренды-партнеры строительной платформы TORMAG.",
      promotions: "Акции, распродажи, спецпредложения и действующие промокоды на строительные материалы в TORMAG.",
      favorites: "Ваш список избранных строительных материалов на платформе TORMAG.",
      orders: "Управление и отслеживание статуса ваших заказов на платформе TORMAG.",
      cabinet: "Личный кабинет покупателя TORMAG. Управление профилем, заказами и бонусами.",
      'cabinet/orders': "История ваших заказов на платформе TORMAG.",
      'cabinet/promotions': "Ваши активные промокоды и купоны на скидку в TORMAG.",
      'cabinet/cashback': "Бонусный баланс и история кешбэка TORMAG.",
      estimate: "Удобная загрузка смет в формате Excel/CSV для автоматического подбора материалов в TORMAG.",
      'cashback/history': "История начисления и списания бонусных баллов кешбэка TORMAG.",
      legal: "Пользовательское соглашение, договор публичной оферты и политика конфиденциальности платформы TORMAG.",
      changelog: "История релизов, новых функций, оптимизаций и исправлений на строительной платформе TORMAG.KZ."
    };

    if (currentPage !== 'product' && currentPage !== 'catalog') {
      document.title = pageTitles[currentPage] || "TORMAG — Всё для стройки и ремонта";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', pageDescriptions[currentPage] || "Строительная платформа TORMAG в Алматы. Огромный выбор строительных материалов от дистрибьюторов по выгодным ценам с доставкой.");
      }
    } else if (currentPage === 'catalog' && !currentCategorySlug) {
      document.title = pageTitles.catalog;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', pageDescriptions.catalog);
      }
    }

    const canonicalPath = getPageHref(currentPage, currentProductId, currentCategorySlug);
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `https://tormag.kz${canonicalPath}`);

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (isCabinetPage) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }
  }, [currentPage, currentProductId, currentCategorySlug, isCabinetPage]);

  useEffect(() => {
    setAnalyticsContext({
      region: region.currentRegion,
      country: 'Казахстан',
      city: region.currentRegion,
    });
  }, [region.currentRegion]);

  useEffect(() => {
    trackEvent('page_view', {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      sessionId: getAnalyticsSessionId(),
      region: region.currentRegion,
      country: 'Казахстан',
      city: region.currentRegion,
    });
  }, [currentPage, currentProductId, currentCategorySlug, currentOrderId, region.currentRegion]);

  return null;
}
