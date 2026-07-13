import React, { useEffect, useMemo, useState } from 'react';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
import {
  ArrowLeft, ShoppingCart, ShieldCheck, Clock, MapPin, Star,
  Truck, Package, CheckCircle2, Tag, RefreshCw, ChevronRight,
  ChevronUp, ChevronDown, Heart, Scale, Share2, Eye, Info, HelpCircle, Coins
} from 'lucide-react';
import { getProductById, getProductReviews, getProductStats } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from '../utils/productImage';
import { trackEvent } from '../utils/analytics';
import { getFriendlyErrorMessage } from '../utils/errorHelper';
import InfoModals from '../components/InfoModals';

const CATEGORY_LABELS = {
  mixes: 'Сухие смеси',
  lumber: 'Пиломатериалы',
  tools: 'Инструменты',
  paints: 'Краски',
  hardware: 'Крепеж',
};

const splitLines = (value) => {
  return value ? value.split('\n').map(line => line.trim()).filter(Boolean) : [];
};

const getProductOptions = (productName) => {
  const nameLower = productName.toLowerCase();
  if (nameLower.includes('цемент')) {
    return {
      label: 'Фасовка:',
      items: [
        { value: '50 кг', available: true },
        { value: '25 кг', available: false, reason: 'Нет в наличии' },
        { value: '10 кг', available: false, reason: 'Под заказ' }
      ]
    };
  }
  if (nameLower.includes('штукатурка') || nameLower.includes('ротбанд')) {
    return {
      label: 'Фасовка:',
      items: [
        { value: '30 кг', available: true },
        { value: '10 кг', available: false, reason: 'Нет в наличии' },
        { value: '5 кг', available: false, reason: 'Под заказ' }
      ]
    };
  }
  if (nameLower.includes('краска') || nameLower.includes('тиккурила')) {
    return {
      label: 'Объем:',
      items: [
        { value: '9 л', available: true },
        { value: '2.7 л', available: false, reason: 'Нет в наличии' },
        { value: '0.9 л', available: false, reason: 'Нет в наличии' }
      ]
    };
  }
  if (nameLower.includes('перфоратор')) {
    return {
      label: 'Модель:',
      items: [
        { value: 'GBH 2-28', available: true },
        { value: 'GBH 2-26', available: false, reason: 'Нет в наличии' }
      ]
    };
  }
  if (nameLower.includes('шуруповерт')) {
    return {
      label: 'Напряжение:',
      items: [
        { value: '18V', available: true },
        { value: '12V', available: false, reason: 'Нет в наличии' }
      ]
    };
  }
  if (nameLower.includes('саморезы') || nameLower.includes('анкерный') || nameLower.includes('пеноплекс')) {
    return {
      label: 'Фасовка / Размер:',
      items: [
        { value: 'Стандарт', available: true },
        { value: 'Увеличенный', available: false, reason: 'Под заказ' }
      ]
    };
  }
  return null;
};

const QuantityInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = (e) => {
    const valStr = e.target.value;
    if (valStr.length > 5) return;
    setLocalVal(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      setLocalVal(value);
      onChange(value);
    } else {
      const clamped = Math.min(99999, parsed);
      setLocalVal(clamped);
      onChange(clamped);
    }
  };

  const inputLength = localVal ? localVal.toString().length : 1;

  return (
    <>
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
      <input
        type="number"
        min="1"
        max="99999"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className="no-spinner text-center text-base font-extrabold text-slate-900 bg-transparent focus:outline-none font-mono w-10"
      />
    </>
  );
};

export default function ProductPage({
  productId,
  onBackToCatalog,
  onAddToCart,
  showToast,
  onNavigate,
  categories = [],
  setSelectedCategory,
  onToggleFavorite,
  isFavorite
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({ page: 1, hasMore: false, total: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [thumbnailOffset, setThumbnailOffset] = useState(0);
  const THUMBS_VISIBLE = 5;

  // Variant selector state
  const [selectedOption, setSelectedOption] = useState('');

  // active tab below (specs vs reviews vs description)
  const [activeTab, setActiveTab] = useState('description');

  // Stats state
  const [stats, setStats] = useState({ views: 0, watching: 0 });
  const [activeInfoModal, setActiveInfoModal] = useState(null);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Купить в TORMAG`;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Купить ${product.name} по выгодной цене in интернет-магазине TORMAG. Рейтинг: ${product.rating || '4.8'} (${product.reviews || '124'} отзывов). Быстрая доставка по Алматы и области, начисление бонусов!`
        );
      }

      const oldScript = document.getElementById('jsonld-product-schema');
      if (oldScript) {
        oldScript.remove();
      }

      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.image,
        "description": product.description || `Купить ${product.name} по выгодной цене в TORMAG.`,
        "sku": `PROD-${product.id}`,
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": "KZT",
          "price": product.price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating || "4.8",
          "reviewCount": product.reviews || "124"
        }
      };

      const script = document.createElement('script');
      script.id = 'jsonld-product-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    return () => {
      const oldScript = document.getElementById('jsonld-product-schema');
      if (oldScript) {
        oldScript.remove();
      }
    };
  }, [product]);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      setActiveImageIndex(0);
      setThumbnailOffset(0);
      setQuantity(1);

      try {
        const data = await getProductById(productId);
        setProduct(data);
        
        // Initialize default option
        const options = getProductOptions(data.name);
        if (options && options.items.length > 0) {
          const firstAvailable = options.items.find(i => i.available) || options.items[0];
          setSelectedOption(firstAvailable.value);
        }

        trackEvent('product_view', {
          productId: data.id,
          value: data.price,
          metadata: {
            name: data.name,
            category: data.category,
          },
        });
        try {
          const viewed = JSON.parse(localStorage.getItem('tormag_recently_viewed') || '[]');
          const filtered = viewed.filter(p => p.id !== data.id);
          filtered.unshift({
            id: data.id,
            name: data.name,
            price: data.price,
            oldPrice: data.oldPrice,
            image: data.image,
            category: data.category,
            supplier: data.supplier,
            isHit: data.isHit
          });
          localStorage.setItem('tormag_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
        } catch (e) {
          console.error('Error saving recently viewed product:', e);
        }
      } catch (err) {
        console.error(err);
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const res = await getProductReviews(productId, { page: 1, limit: 10 });
        if (res && res.data) {
          setReviews(res.data);
          setReviewsMeta({
            page: res.page || 1,
            hasMore: res.hasMore || false,
            total: res.total || res.data.length
          });
        } else if (Array.isArray(res)) {
          setReviews(res);
          setReviewsMeta({ page: 1, hasMore: false, total: res.length });
        }
      } catch (err) {
        console.error('Error loading product reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    const loadStats = async () => {
      try {
        const statsData = await getProductStats(productId);
        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error loading product stats:', err);
      }
    };

    if (productId) {
      loadProduct();
      loadReviews();
      loadStats();
    }
  }, [productId]);

  const loadMoreReviews = async () => {
    if (loadingMoreReviews || !reviewsMeta.hasMore) return;
    setLoadingMoreReviews(true);
    try {
      const nextPage = reviewsMeta.page + 1;
      const res = await getProductReviews(productId, { page: nextPage, limit: 10 });
      if (res && res.data) {
        setReviews(prev => [...prev, ...res.data]);
        setReviewsMeta({
          page: res.page,
          hasMore: res.hasMore,
          total: res.total
        });
      }
    } catch (err) {
      console.error('Error loading more reviews:', err);
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  const breadcrumbs = useMemo(() => {
    if (!product || !categories || categories.length === 0) return [];
    
    let currentCat = categories.find(c => c.id === product.categoryId || c.slug === product.category);
    
    if (!currentCat && product.categoryRelation) {
      currentCat = categories.find(c => c.id === product.categoryRelation.id);
    }
    
    if (!currentCat) return [];

    const path = [];
    let temp = currentCat;
    while (temp) {
      path.unshift(temp);
      if (temp.parentId) {
        const parent = categories.find(c => c.id === temp.parentId);
        temp = parent;
      } else {
        temp = null;
      }
    }
    return path;
  }, [product, categories]);

  const parsedSpecs = useMemo(() => {
    if (!product?.specifications) return [];
    const lines = product.specifications.split(/\r?\n/);
    const result = [];
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.includes(';') ? line.split(';') : [line];
      parts.forEach(part => {
        if (!part.trim()) return;
        const colonIdx = part.indexOf(':');
        if (colonIdx !== -1) {
          const key = part.substring(0, colonIdx).trim();
          const val = part.substring(colonIdx + 1).trim();
          if (key && val) {
            result.push({ label: key, value: val });
          }
        } else {
          result.push({ label: part.trim(), value: '' });
        }
      });
    });
    return result;
  }, [product?.specifications]);

  const groupedSpecs = useMemo(() => {
    if (parsedSpecs.length === 0) return {};
    
    const groups = {
      'Основные характеристики': ['бренд', 'страна', 'производитель', 'назначение', 'тип', 'состав', 'вид'],
      'Физические свойства': ['цвет', 'фракция', 'вес', 'объем', 'размер', 'толщина', 'ширина', 'длина', 'высота', 'плотность'],
      'Технические параметры': ['мощность', 'напряжение', 'аккумулятор', 'сила удара', 'обороты', 'частота', 'емкость', 'диаметр']
    };

    const result = {};

    parsedSpecs.forEach(item => {
      const labelLower = item.label.toLowerCase();
      let matchedGroup = 'Прочие характеристики';
      
      for (const [groupName, keywords] of Object.entries(groups)) {
        if (keywords.some(k => labelLower.includes(k))) {
          matchedGroup = groupName;
          break;
        }
      }

      if (!result[matchedGroup]) {
        result[matchedGroup] = [];
      }
      result[matchedGroup].push(item);
    });

    return result;
  }, [parsedSpecs]);

  const specs = useMemo(() => splitLines(product?.specifications), [product]);
  const usage = useMemo(() => splitLines(product?.usage), [product]);

  const allImages = useMemo(() => {
    const list = [];
    if (product?.image) {
      list.push(product.image);
    }
    if (Array.isArray(product?.images)) {
      product.images.forEach(img => {
        if (img && typeof img === 'string' && img.trim() !== '' && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    return list.length > 0 ? list : [FALLBACK_PRODUCT_IMAGE];
  }, [product]);

  const handleShare = () => {
    setActiveInfoModal('share');
  };

  const handleBuyNow = () => {
    if (!product) return;
    onAddToCart(product, quantity);
    onNavigate?.('cart');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center text-slate-400">
        <RefreshCw className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Загрузка информации о товаре...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm max-w-2xl mx-auto my-12">
        <Package className="h-16 w-16 text-slate-350 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-slate-900 font-outfit mb-2">Товар не найден</h1>
        <p className="text-sm text-slate-500 mb-6">{error || 'Указанный товар отсутствует или удален.'}</p>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться в каталог
        </button>
      </div>
    );
  }

  const activeImage = allImages[activeImageIndex] || allImages[0];
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;
  const isFav = isFavorite ? isFavorite(product.id) : false;
  const optionsConfig = getProductOptions(product.name);

  // Articles generated or fetched
  const articleNum = product.article || `2989${10 + product.id}`;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Breadcrumbs ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
        <Link
          href={getPageHref('home')}
          onClick={() => onNavigate?.('home')}
          className="hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-400"
        >
          Главная
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
        <Link
          href={getPageHref('catalog')}
          onClick={onBackToCatalog}
          className="hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-400"
        >
          Каталог
        </Link>
        {breadcrumbs.map((cat) => (
          <React.Fragment key={cat.id}>
            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
            <Link
              href={getPageHref('catalog', null, cat.slug)}
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory(cat.slug || cat.id);
              }}
              className="hover:text-blue-600 transition-colors text-left cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-400"
            >
              {cat.name}
            </Link>
          </React.Fragment>
        ))}
        <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
        <span className="text-slate-600 font-bold truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </div>

      {/* ── Main Product Section (Two separate blocks) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* BLOCK 1: Gallery & Product Details (9 cols on lg) */}
        <div className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col justify-between h-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
            
            {/* COLUMN 1: IMAGE GALLERY */}
            <div className="md:col-span-7 flex flex-col h-full min-h-[380px] sm:min-h-[450px]">
              <div className="flex flex-col space-y-4">
                <div className="relative border border-slate-100 bg-slate-50/50 rounded-2xl p-6 flex items-center justify-center min-h-[300px] sm:min-h-[385px] group overflow-hidden">
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                    {product.isHit && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                        Хит
                      </span>
                    )}
                    {discount && (
                      <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Main Image */}
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full max-w-sm h-[280px] sm:h-[320px] object-contain drop-shadow-md group-hover:scale-105 transition-all duration-300"
                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_PRODUCT_IMAGE; }}
                  />
                </div>

                {/* Thumbnails strip */}
                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIndex(i)}
                        className={`w-[60px] h-[60px] rounded-xl border bg-white overflow-hidden p-1 transition-all shrink-0 hover:border-blue-500 ${
                          activeImageIndex === i
                            ? 'border-blue-600 ring-2 ring-blue-100'
                            : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} - фото ${i + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_PRODUCT_IMAGE; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Engagement Metrics (No pulsing dot, aligned to bottom like Kaspi) */}
              <div className="mt-auto pt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                <div className="flex items-center">
                  <span>Смотрят сейчас:</span>
                  <span className="text-emerald-600 font-bold ml-1.5">
                    {stats.watching || 1} {(stats.watching || 1) % 10 === 1 && (stats.watching || 1) % 100 !== 11 ? 'человек' : [2, 3, 4].includes((stats.watching || 1) % 10) && ![12, 13, 14].includes((stats.watching || 1) % 100) ? 'человека' : 'человек'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-slate-455 shrink-0" />
                  <span className="text-slate-500 font-bold">{stats.views || 0}</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: SPECS, RATING & OPTIONS */}
            <div className="md:col-span-5 flex flex-col space-y-6">
              <div>
                {/* Rating & Review counter */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center text-amber-400 gap-0.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-slate-800 ml-1">{product.rating || '4.8'}</span>
                  </div>
                  <span className="h-3 w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => scrollToSection('reviews-section')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors hover:underline"
                  >
                    {reviewsMeta.total} отзывов
                  </button>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit leading-snug mb-1">
                  {product.name}
                </h1>

                <div className="text-[11px] font-bold text-slate-400 font-mono">
                  Артикул: {articleNum}
                </div>
              </div>

              {/* Variant selector options */}
              {optionsConfig && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {optionsConfig.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {optionsConfig.items.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={!opt.available}
                        onClick={() => setSelectedOption(opt.value)}
                        className={`relative px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                          !opt.available
                            ? 'border-slate-100 bg-slate-50 text-slate-350 border-dashed cursor-not-allowed'
                            : selectedOption === opt.value
                            ? 'border-blue-600 bg-blue-50/50 text-blue-600 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-400 text-slate-700'
                        }`}
                        title={opt.reason || ''}
                      >
                        {opt.value}
                        {!opt.available && opt.reason && (
                          <span className="block text-[8px] font-medium text-slate-400 mt-0.5">
                            {opt.reason}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact Specs list with dotted leader line */}
              {parsedSpecs.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Характеристики:
                  </h3>
                  <div className="space-y-2.5">
                    {parsedSpecs.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-end text-xs font-semibold leading-relaxed w-full">
                        <span className="text-slate-400 shrink-0 pr-1">{item.label}</span>
                        <span className="border-b border-dotted border-slate-200 flex-grow mb-1 min-w-[10px]"></span>
                        <span className="text-slate-800 font-bold pl-1 shrink-0 break-all max-w-[60%]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {parsedSpecs.length > 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('specs');
                        scrollToSection('tabs-section');
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-bold block text-center mt-3 cursor-pointer bg-transparent border-0 w-full"
                    >
                      Все характеристики
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* BLOCK 2: Sticky Buy Box (3 cols on lg) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-4 h-full">
          {/* Guarantee Label */}
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-extrabold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Гарантия низкой цены</span>
          </div>

          {/* Pricing block */}
          <div>
            {product.oldPrice && (
              <div className="text-xs text-slate-400 line-through mb-0.5">
                {formatPrice(product.oldPrice * quantity)}
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 font-outfit">
                {formatPrice(product.price * quantity)}
              </span>
              <span className="text-xs text-slate-400">
                {quantity > 1 ? `за ${quantity} шт` : '/ шт'}
              </span>
            </div>

            {/* Cashback computation */}
            <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-emerald-700 bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-md">
              <Tag className="h-3 w-3" />
              <span>+ {formatPrice(Math.round(product.price * (product.cashbackPercent ?? 3) / 100) * quantity)} бонусов</span>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl h-11 p-1 justify-between shadow-sm">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold rounded-lg transition-all text-lg"
            >
              -
            </button>
            <QuantityInput value={quantity} onChange={setQuantity} />
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold rounded-lg transition-all text-lg"
            >
              +
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onAddToCart(product, quantity)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold h-11 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              В корзину
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full border border-blue-600 hover:bg-blue-50 text-blue-600 font-extrabold h-11 rounded-xl transition-all flex items-center justify-center"
            >
              Купить сейчас
            </button>
          </div>

          {/* Shipping info */}
          <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 font-medium">Продавец: </span>
                <span className="font-bold text-slate-800 block sm:inline">{product.supplier?.name || 'TORMAG.KZ'}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 font-medium">Доставка: </span>
                <span className="font-bold text-slate-800">{product.supplier?.delivery || '1-2 дня'}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-455 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 font-medium">Склад: </span>
                <span className="font-bold text-slate-800">Алматы, РК</span>
              </div>
            </div>
          </div>

          {/* Price alert */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('priceAlert')}
            className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors pt-1 cursor-pointer"
          >
            Сообщить о снижении цены
          </button>

          {/* Under-card Actions */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-around gap-2 text-slate-400">
            <button
              type="button"
              onClick={() => showToast?.('⚖️ Товар добавлен в список сравнения')}
              className="flex flex-col items-center gap-1 hover:text-slate-700 transition-colors text-[10px] font-bold"
            >
              <Scale className="h-4.5 w-4.5" />
              <span>Сравнить</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite?.(product)}
              className={`flex flex-col items-center gap-1 transition-colors text-[10px] font-bold ${
                isFav ? 'text-red-500 hover:text-red-600' : 'hover:text-slate-700'
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-current' : ''}`} />
              <span>{isFav ? 'В избранном' : 'В избранное'}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex flex-col items-center gap-1 hover:text-slate-700 transition-colors text-[10px] font-bold"
            >
              <Share2 className="h-4.5 w-4.5" />
              <span>Поделиться</span>
            </button>
          </div>
        </div>

      </div>

      {/* ── Service Info Badges (Aligned under the left card) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Badge 1: Нашли дешевле */}
            <div 
              onClick={() => setActiveInfoModal('lowPrice')}
              className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer shadow-xs w-full h-full"
            >
              <Coins className="h-6 w-6 text-slate-800 shrink-0" />
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800 leading-tight font-outfit">Нашли товар дешевле?</h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Компенсируем 110% разницы</p>
              </div>
            </div>

            {/* Badge 2: Условия доставки */}
            <div 
              onClick={() => setActiveInfoModal('delivery')}
              className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer shadow-xs w-full h-full"
            >
              <RefreshCw className="h-6 w-6 text-slate-800 shrink-0" />
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800 leading-tight font-outfit">Условия доставки и самовывоза</h4>
              </div>
            </div>

            {/* Badge 3: Условия возврата */}
            <div 
              onClick={() => setActiveInfoModal('returns')}
              className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer shadow-xs w-full h-full"
            >
              <Truck className="h-6 w-6 text-slate-800 shrink-0" />
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-800 leading-tight font-outfit">Условия возврата и обмена</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section with Tabs ── */}
      <div id="tabs-section" className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'description'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Описание
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'specs'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Характеристики ({parsedSpecs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Отзывы ({reviewsMeta.total})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="space-y-6">
              <div className="prose prose-slate max-w-none text-sm text-slate-655 leading-relaxed">
                <p className="whitespace-pre-line">
                  {product.details || product.description || 'Поставщик пока не добавил подробное описание товара.'}
                </p>
              </div>

              {usage.length > 0 && (
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h3 className="text-base font-extrabold text-slate-900 font-outfit">Способ применения / Инструкция</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                    {usage.map((step, i) => (
                      <li key={i} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL SPECS */}
          {activeTab === 'specs' && (
            <div className="max-w-3xl space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 font-outfit mb-4">Технические характеристики</h3>
              {Object.keys(groupedSpecs).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedSpecs).map(([groupName, items]) => (
                    <div key={groupName} className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      {/* Left Column: Group Header */}
                      <div className="text-slate-400 font-extrabold text-xs uppercase tracking-wider md:pt-1">
                        {groupName}
                      </div>
                      {/* Right Column: Dotted list of specs */}
                      <div className="md:col-span-2 space-y-3">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-end text-xs font-semibold leading-relaxed w-full">
                            <span className="text-slate-500 shrink-0 pr-1">{item.label}</span>
                            <span className="border-b border-dotted border-slate-200 flex-grow mb-1 min-w-[10px]"></span>
                            <span className="text-slate-800 font-bold pl-1 shrink-0 break-all max-w-[60%]">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Характеристики пока не добавлены.</p>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div id="reviews-section" className="space-y-8">
              {/* Rating header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-outfit">Отзывы о товаре</h3>
                  <p className="text-slate-400 text-xs font-semibold">На основе подтвержденных покупок</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-5 w-5 fill-amber-400" />
                    <span className="ml-1.5 font-outfit text-xl font-black text-slate-900">{product.rating || '4.8'}</span>
                  </div>
                  <span className="text-slate-200">|</span>
                  <span className="text-xs font-bold text-slate-500">{reviewsMeta.total} отзывов</span>
                </div>
              </div>

              {/* Reviews body */}
              {loadingReviews ? (
                <div className="py-8 text-center text-sm font-semibold text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Загружаем отзывы покупателей...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100/50">
                  <p className="text-sm font-bold text-slate-400">У этого товара пока нет отзывов.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Отзывы могут оставлять только клиенты, которые приобрели и получили этот товар.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="divide-y divide-slate-100">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="py-6 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm font-outfit">{rev.user?.name}</span>
                              <span className="text-slate-350 text-[10px]">·</span>
                              <span className="text-slate-400 text-xs font-semibold">
                                {new Date(rev.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            {/* Stars */}
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {rev.user?.email && (
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100/80">
                              {rev.user.email}
                            </span>
                          )}
                        </div>
                        {rev.comment && (
                          <p className="text-sm text-slate-600 leading-relaxed mt-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100/40 font-medium">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {reviewsMeta.hasMore && (
                    <div className="pt-4 text-center">
                      <button
                        type="button"
                        onClick={loadMoreReviews}
                        disabled={loadingMoreReviews}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {loadingMoreReviews ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                            Загрузка...
                          </>
                        ) : (
                          'Показать еще отзывы'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Modals */}
      <InfoModals
        isOpen={!!activeInfoModal}
        type={activeInfoModal}
        onClose={() => setActiveInfoModal(null)}
        showToast={showToast}
      />
    </div>
  );
}
