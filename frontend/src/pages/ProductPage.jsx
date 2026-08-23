import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
import {
  ArrowLeft, ShoppingCart, ShieldCheck, Clock, MapPin, Star,
  Truck, Package, CheckCircle2, Tag, RefreshCw, ChevronRight, ChevronLeft, X, ZoomIn, Maximize2,
  ChevronUp, ChevronDown, Heart, Scale, Share2, Eye, Info, HelpCircle, Coins, RotateCcw, Zap,
  Home, LayoutGrid, User, Sparkles
} from 'lucide-react';
import { getProductById, getProductReviews, getProductStats, getSystemSettings, getCartRecommendationsApi } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { FALLBACK_PRODUCT_IMAGE, getProductImage, getIpxImageUrl, markImageFailed } from '../utils/productImage';
import { trackEvent } from '../utils/analytics';
import { getFriendlyErrorMessage } from '../utils/errorHelper';
import InfoModals from '../components/InfoModals';
import CityModal from '../components/CityModal';
import CartRecommendationsCarousel from '../components/CartRecommendationsCarousel';
import ProductGallery from '../components/ProductPage/ProductGallery';
import ProductHeaderInfo from '../components/ProductPage/ProductHeaderInfo';
import ProductSpecsPreview from '../components/ProductPage/ProductSpecsPreview';
import ProductBuyBox from '../components/ProductPage/ProductBuyBox';
import ProductDeliveryAndActions from '../components/ProductPage/ProductDeliveryAndActions';

const splitLines = (value) => {
  return value ? value.split('\n').map(line => line.trim()).filter(Boolean) : [];
};

const getProductOptions = (product) => {
  if (!product) return null;
  if (product.options && typeof product.options === 'object' && product.options.label && Array.isArray(product.options.items) && product.options.items.length > 0) {
    return product.options;
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
  onUpdateCartQuantity,
  cart = [],
  showToast,
  onNavigate,
  categories = [],
  setSelectedCategory,
  onToggleFavorite,
  isFavorite,
  customer,
  onOpenAuthLogin
}) {
  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  const navItems = [
    {
      id: 'home',
      label: 'Главная',
      icon: Home,
      action: () => onNavigate?.('home'),
      isActive: false,
    },
    {
      id: 'catalog',
      label: 'Каталог',
      icon: LayoutGrid,
      action: () => onNavigate?.('catalog'),
      isActive: false,
    },
    {
      id: 'cart',
      label: 'Корзина',
      icon: ShoppingCart,
      badge: totalCartCount,
      action: () => onNavigate?.('cart'),
      isActive: false,
    },
    {
      id: 'cabinet',
      label: 'Кабинет',
      icon: User,
      action: () => {
        if (customer) {
          onNavigate?.('cabinet');
        } else if (onOpenAuthLogin) {
          onOpenAuthLogin();
        } else {
          onNavigate?.('cabinet');
        }
      },
      isActive: false,
    },
    {
      id: 'ai-assistant',
      label: 'Чат AI',
      icon: Sparkles,
      action: () => onNavigate?.('ai-assistant'),
      isActive: false,
      isAi: true,
    },
  ];
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({ page: 1, hasMore: false, total: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [thumbnailOffset, setThumbnailOffset] = useState(0);
  const THUMBS_VISIBLE = 5;
  const thumbsRef = useRef(null);

  const scrollThumbs = (dir) => {
    if (thumbsRef.current) {
      thumbsRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  };

  const openZoomModal = (initialIndex = activeImageIndex) => {
    setModalImageIndex(initialIndex);
    setIsZoomOpen(true);
  };

  const closeZoomModal = () => {
    setActiveImageIndex(modalImageIndex);
    setIsZoomOpen(false);
  };

  const modalTouchStartX = useRef(0);
  const modalTouchEndX = useRef(0);

  const handleModalTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      modalTouchStartX.current = e.targetTouches[0].clientX;
      modalTouchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleModalTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      modalTouchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleModalTouchEnd = () => {
    const swipeDiff = modalTouchStartX.current - modalTouchEndX.current;
    const minSwipeDistance = 35;

    if (swipeDiff > minSwipeDistance) {
      setModalImageIndex((prev) => (allImages.length > 0 ? (prev < allImages.length - 1 ? prev + 1 : 0) : prev));
    } else if (swipeDiff < -minSwipeDistance) {
      setModalImageIndex((prev) => (allImages.length > 0 ? (prev > 0 ? prev - 1 : allImages.length - 1) : prev));
    }
  };

  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeZoomModal();
      } else if (e.key === 'ArrowLeft') {
        setModalImageIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setModalImageIndex(prev => (prev < 99 ? prev + 1 : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, modalImageIndex]);

  // Variant selector state
  const [selectedOption, setSelectedOption] = useState('');

  // active tab below (specs vs reviews vs description)
  const [activeTab, setActiveTab] = useState('description');

  // Stats state
  const [stats, setStats] = useState({ views: 0, watching: 0 });
  const [activeInfoModal, setActiveInfoModal] = useState(null);

  // Delivery & City selector state
  const [userCity, setUserCity] = useState(() => {
    try {
      return localStorage.getItem('tormag_user_city') || 'Алматы';
    } catch {
      return 'Алматы';
    }
  });
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);

  useEffect(() => {
    getSystemSettings().then(res => {
      if (res) setSystemSettings(res);
    }).catch(() => {});
  }, []);

  const deliveryInfo = useMemo(() => {
    const routes = systemSettings?.deliveryRoutes || [];
    const warehouseCity = systemSettings?.defaultWarehouseCity || 'Алматы';
    if (userCity.toLowerCase() === warehouseCity.toLowerCase()) {
      return { days: 1, label: '1 день (Завтра)' };
    }
    const matched = routes.find(r => r.to?.toLowerCase() === userCity.toLowerCase());
    const days = matched ? matched.days : 3;
    const daysWord = days === 1 ? 'день' : (days >= 2 && days <= 4 ? 'дня' : 'дней');
    return { days, label: `${days} ${daysWord}` };
  }, [userCity, systemSettings]);

  const estimatedDeliveryDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + deliveryInfo.days);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `до ${d.getDate()} ${months[d.getMonth()]}`;
  }, [deliveryInfo.days]);

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

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Купить в TORMAG`;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Купить ${product.name} по выгодной цене в интернет-магазине TORMAG. Рейтинг: ${product.rating || '4.8'} (${product.reviews || '124'} отзывов). Быстрая доставка по Алматы и Казахстану, начисление бонусов!`
        );
      }

      // Cleanup old scripts
      ['jsonld-product-schema', 'jsonld-breadcrumb-schema'].forEach(id => {
        const old = document.getElementById(id);
        if (old) old.remove();
      });

      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image],
        "description": product.description || `Купить ${product.name} по выгодной цене в TORMAG.`,
        "sku": product.article || `PROD-${product.id}`,
        "mpn": `TORMAG-${product.id}`,
        "brand": {
          "@type": "Brand",
          "name": product.brand || product.supplier?.name || "TORMAG"
        },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": "KZT",
          "price": product.price,
          "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": product.supplier?.name || "TORMAG.KZ"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating || "4.8",
          "reviewCount": product.reviews || "124"
        }
      };

      const scriptProduct = document.createElement('script');
      scriptProduct.id = 'jsonld-product-schema';
      scriptProduct.type = 'application/ld+json';
      scriptProduct.innerHTML = JSON.stringify(schemaData);
      document.head.appendChild(scriptProduct);

      // Breadcrumb Schema
      if (breadcrumbs && breadcrumbs.length > 0) {
        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Главная",
              "item": window.location.origin
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Каталог",
              "item": `${window.location.origin}/#catalog`
            },
            ...breadcrumbs.map((cat, idx) => ({
              "@type": "ListItem",
              "position": idx + 3,
              "name": cat.name,
              "item": `${window.location.origin}/#category-${cat.slug || cat.id}`
            })),
            {
              "@type": "ListItem",
              "position": breadcrumbs.length + 3,
              "name": product.name,
              "item": window.location.href
            }
          ]
        };
        const scriptBC = document.createElement('script');
        scriptBC.id = 'jsonld-breadcrumb-schema';
        scriptBC.type = 'application/ld+json';
        scriptBC.innerHTML = JSON.stringify(breadcrumbSchema);
        document.head.appendChild(scriptBC);
      }
    }

    return () => {
      ['jsonld-product-schema', 'jsonld-breadcrumb-schema'].forEach(id => {
        const old = document.getElementById(id);
        if (old) old.remove();
      });
    };
  }, [product, breadcrumbs]);

  useEffect(() => {
    const loadReviews = async (idToUse = productId) => {
      setLoadingReviews(true);
      try {
        const res = await getProductReviews(idToUse, { page: 1, limit: 10 });
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

    const loadStats = async (idToUse = productId) => {
      try {
        const statsData = await getProductStats(idToUse);
        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error loading product stats:', err);
      }
    };

    const initProductData = async () => {
      setLoading(true);
      setError(null);
      setActiveImageIndex(0);
      setThumbnailOffset(0);
      setQuantity(1);

      try {
        const data = await getProductById(productId);
        setProduct(data);
        
        // Auto-update browser address bar from old numeric ID to new official product slug URL
        if (data.slug && productId !== data.slug) {
          const canonicalHref = getPageHref('product', data.slug);
          window.history.replaceState(null, '', canonicalHref);
        }

        // Initialize default option
        const options = getProductOptions(data);
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
          const filtered = viewed.filter(p => String(p.id) !== String(data.id));
          filtered.unshift({
            id: data.id,
            name: data.name,
            price: data.price,
            oldPrice: data.oldPrice,
            image: data.image,
            category: data.category,
            supplier: data.supplier,
            isHit: data.isHit,
            options: data.options,
          });
          localStorage.setItem('tormag_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
        } catch (e) {
          console.error('Error saving recently viewed product:', e);
        }

        // Fetch reviews, stats and companion recommendations
        loadReviews(data.id);
        loadStats(data.id);
        getCartRecommendationsApi([{ productId: data.id, categoryId: data.categoryId }])
          .then(recs => setRecommendations(recs || []))
          .catch(err => console.error('Error loading recommendations:', err));
      } catch (err) {
        console.error(err);
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      initProductData();
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

  const parsedSpecs = useMemo(() => {
    if (!product?.specifications) return [];
    let text = String(product.specifications);

    // Remove glued table header titles
    text = text.replace(/^Технические характеристикиПараметрЗначение/gi, '');
    text = text.replace(/^ХарактеристикиПараметрЗначение/gi, '');
    text = text.replace(/^ПараметрЗначение/gi, '');

    // List of common keys to split on if text is glued together (longest keys first!)
    const knownKeys = [
      'Коэффициент теплопроводности',
      'Предел прочности на сжатие',
      'Температурный диапазон эксплуатации',
      'Количество в упаковке',
      'Площадь в упаковке',
      'Страна-производитель',
      'Страна производства',
      'Материал / Состав',
      'Группа горючести',
      'Тип крепежа',
      'Тип головки',
      'Тип шлица',
      'Тип резьбы',
      'Тип кромки',
      'Срок хранения',
      'Плотность',
      'Толщина',
      'Ширина',
      'Длина',
      'Высота',
      'Объем',
      'Размер',
      'Бренд',
      'Страна',
      'Назначение',
      'Состав',
      'Материал',
      'Цвет',
      'Мощность',
      'Напряжение',
      'Емкость',
      'Диаметр',
      'Фракция',
      'Упаковка',
      'Вид',
      'Тип',
      'Вес'
    ];

    // If the text has no newlines, auto-insert newlines and colons before known keys
    if (!text.includes('\n')) {
      knownKeys.forEach(k => {
        const regex = new RegExp(`(${k})`, 'gi');
        text = text.replace(regex, '\n$1: ');
      });
    }

    const lines = text.split(/\r?\n/);
    const result = [];

    lines.forEach(line => {
      let l = line.trim().replace(/^ПараметрЗначение/gi, '').trim();
      if (!l) return;

      const colonIdx = l.indexOf(':');
      if (colonIdx !== -1) {
        let key = l.substring(0, colonIdx).replace(/^[\s;,-]+/, '').trim();
        let val = l.substring(colonIdx + 1).replace(/^[\s;,-]+/, '').trim();

        // Auto-heal double colons like "Тип: крепежа: Саморез по дереву" -> "Тип крепежа: Саморез по дереву"
        if (val.includes(':')) {
          const secondColonIdx = val.indexOf(':');
          const subKeyPart = val.substring(0, secondColonIdx).trim();
          const subValPart = val.substring(secondColonIdx + 1).trim();
          if (subKeyPart && subKeyPart.length < 25 && !subKeyPart.includes(' ')) {
            key = `${key} ${subKeyPart}`;
            val = subValPart;
          }
        }

        if (key && val) {
          result.push({ label: key, value: val });
          return;
        }
      }

      // Check if line starts with any known key (longest key checked first)
      const matchedKey = knownKeys.find(k => l.toLowerCase().startsWith(k.toLowerCase()));
      if (matchedKey) {
        let rest = l.substring(matchedKey.length).trim();
        if (rest.startsWith(':')) rest = rest.substring(1).trim();
        rest = rest.replace(/^[\s;,-]+/, '').trim();
        if (rest) {
          result.push({ label: matchedKey, value: rest });
          return;
        }
      }

      if (l.includes(':')) {
        const idx = l.indexOf(':');
        result.push({ label: l.substring(0, idx).trim(), value: l.substring(idx + 1).trim() });
      } else {
        result.push({ label: l, value: '' });
      }
    });

    return result;
  }, [product?.specifications]);

  const groupedSpecs = useMemo(() => {
    if (parsedSpecs.length === 0) return {};
    
    const groups = {
      'Основные характеристики': ['бренд', 'страна', 'производитель', 'назначение', 'тип', 'состав', 'вид'],
      'Физические свойства': ['цвет', 'фракция', 'вес', 'объем', 'размер', 'толщина', 'ширина', 'длина', 'высота', 'плотность'],
      'Технические параметры': ['мощность', 'напряжение', 'аккумулятор', 'сила удара', 'обороты', 'частота', 'емкость', 'диаметр', 'коэффициент', 'горючести', 'температурный', 'прочности']
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

  const optionsConfig = useMemo(() => {
    return getProductOptions(product);
  }, [product]);

  const selectedOptionItem = useMemo(() => {
    if (!optionsConfig || !optionsConfig.items) return null;
    return optionsConfig.items.find(i => i.value === selectedOption) || null;
  }, [optionsConfig, selectedOption]);

  const activePromotion = useMemo(() => {
    if (!product) return null;
    return product.activePromotion || (product.promotions && product.promotions.length > 0 ? product.promotions[0] : null);
  }, [product]);

  // После activePromotion — считаем кол-во из корзины для этого товара (с учётом варианта)
  const cartItemForProduct = useMemo(() => {
    if (!product) return null;
    return cart.find(i => {
      if (i.id !== product.id) return false;
      // если есть варианты — ищем точное совпадение
      if (selectedOption) return (i.selectedOption || '') === selectedOption;
      return true;
    }) || null;
  }, [cart, product, selectedOption]);

  const cartQty = cartItemForProduct?.quantity || 0;
  const inCart = cartQty > 0;
  // displayQty: пока товар в корзине — считаем по кол-ву из корзины; иначе — по локальному селектору
  const displayQty = inCart ? cartQty : quantity;

  const promoDiscountPercentage = useMemo(() => {
    if (!activePromotion) return 0;
    const tiers = activePromotion.quantityTiers || [];
    if (tiers.length > 0) {
      const matched = tiers.reduce((best, t) => (displayQty >= t.minQuantity ? t : best), null);
      if (matched) return matched.discountValue;
      return 0;
    }
    if (activePromotion.minQuantity && displayQty >= activePromotion.minQuantity) {
      return activePromotion.discountValue || 0;
    }
    return 0;
  }, [activePromotion, displayQty]);

  const basePriceBeforePromo = useMemo(() => {
    if (selectedOptionItem && selectedOptionItem.price && !isNaN(parseFloat(selectedOptionItem.price))) {
      return parseFloat(selectedOptionItem.price);
    }
    return product?.price || 0;
  }, [selectedOptionItem, product?.price]);

  const effectivePrice = useMemo(() => {
    let price = basePriceBeforePromo;
    if (promoDiscountPercentage > 0) {
      if (activePromotion?.discountType === 'PERCENT') {
        price = Math.round(price * (1 - promoDiscountPercentage / 100));
      } else {
        price = Math.max(0, price - promoDiscountPercentage);
      }
    }
    return price;
  }, [basePriceBeforePromo, promoDiscountPercentage, activePromotion?.discountType]);

  const unitOldPrice = useMemo(() => {
    if (selectedOptionItem && selectedOptionItem.oldPrice && !isNaN(parseFloat(selectedOptionItem.oldPrice))) {
      return parseFloat(selectedOptionItem.oldPrice);
    }
    if (promoDiscountPercentage > 0 && effectivePrice < basePriceBeforePromo) {
      return product?.oldPrice && product.oldPrice > basePriceBeforePromo ? product.oldPrice : basePriceBeforePromo;
    }
    if (product?.oldPrice && product?.price && product.oldPrice > product.price) {
      const ratio = basePriceBeforePromo / product.price;
      return Math.round(product.oldPrice * ratio);
    }
    return product?.oldPrice || null;
  }, [selectedOptionItem, product?.oldPrice, product?.price, basePriceBeforePromo, promoDiscountPercentage, effectivePrice]);

  const totalMainPrice = useMemo(() => effectivePrice * displayQty, [effectivePrice, displayQty]);
  const totalOldPrice = useMemo(() => unitOldPrice ? unitOldPrice * displayQty : null, [unitOldPrice, displayQty]);
  const showStrikethroughOldPrice = useMemo(() => totalOldPrice !== null && totalOldPrice > totalMainPrice, [totalOldPrice, totalMainPrice]);

  const handleShare = () => {
    setActiveInfoModal('share');
  };

  const handleBuyNow = () => {
    if (!product) return;
    const itemToAdd = {
      ...product,
      price: effectivePrice,
      selectedOption: selectedOption || undefined,
      selectedOptionLabel: optionsConfig?.label || product?.options?.label || undefined,
    };
    onAddToCart(itemToAdd, quantity);
    onNavigate?.('cart');
  };

  const handleAddToCartWithOption = () => {
    if (!product) return;
    const itemToAdd = {
      ...product,
      price: effectivePrice,
      selectedOption: selectedOption || undefined,
      selectedOptionLabel: optionsConfig?.label || product?.options?.label || undefined,
    };
    onAddToCart(itemToAdd, quantity);
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

  // Article / SKU
  const articleNum = product?.article || product?.sku || product?.code || (product?.id ? `TRM-${product.id}` : '');

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
      {/* ── Breadcrumbs (Hidden on Mobile) ── */}
      <div className="hidden md:flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
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

      {/* ── MOBILE PRODUCT CARD SPECIFIC ORDER (< lg) Kaspi-Style ── */}
      <div className="block lg:hidden bg-white border border-slate-100 rounded-3xl shadow-sm p-3.5 space-y-3">
        
        {/* 1. Фото товара и полоса миниатюр */}
        <ProductGallery
          product={product}
          allImages={allImages}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
          openZoomModal={openZoomModal}
          scrollThumbs={scrollThumbs}
          thumbsRef={thumbsRef}
          discount={discount}
          getIpxImageUrl={getIpxImageUrl}
          FALLBACK_PRODUCT_IMAGE={FALLBACK_PRODUCT_IMAGE}
          markImageFailed={markImageFailed}
        />

        {/* 2. Блок цены, акции, бонусов и покупка */}
        <div className="pt-2">
          <ProductBuyBox
            product={product}
            activePromotion={activePromotion}
            promoDiscountPercentage={promoDiscountPercentage}
            showStrikethroughOldPrice={showStrikethroughOldPrice}
            totalOldPrice={totalOldPrice}
            totalMainPrice={totalMainPrice}
            effectivePrice={effectivePrice}
            displayQty={displayQty}
            cartQty={cartQty}
            cartItemForProduct={cartItemForProduct}
            selectedOption={selectedOption}
            inCart={inCart}
            handleAddToCartWithOption={handleAddToCartWithOption}
            handleBuyNow={handleBuyNow}
            onUpdateCartQuantity={onUpdateCartQuantity}
            onNavigate={onNavigate}
            formatPrice={formatPrice}
            onToggleFavorite={onToggleFavorite}
            isFav={isFav}
            handleShare={handleShare}
            showToast={showToast}
            hideButtons={true}
          />
        </div>

        {/* 3. Название товара + рейтинг */}
        <div className="border-t border-slate-100 pt-3">
          <ProductHeaderInfo
            product={product}
            reviewsMeta={reviewsMeta}
            articleNum={articleNum}
            setActiveTab={setActiveTab}
            scrollToSection={scrollToSection}
          />
        </div>

        {/* 4. Варианты и краткие характеристики */}
        {(optionsConfig || (parsedSpecs && parsedSpecs.length > 0)) && (
          <div className="border-t border-slate-100 pt-3">
            <ProductSpecsPreview
              optionsConfig={optionsConfig}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              parsedSpecs={parsedSpecs}
              setActiveTab={setActiveTab}
              scrollToSection={scrollToSection}
              formatPrice={formatPrice}
              product={product}
            />
          </div>
        )}

        {/* 5. Доставка и действия */}
        <div className="border-t border-slate-100 pt-3">
          <ProductDeliveryAndActions
            userCity={userCity}
            setIsCityModalOpen={setIsCityModalOpen}
            deliveryInfo={deliveryInfo}
            estimatedDeliveryDateStr={estimatedDeliveryDateStr}
            setActiveInfoModal={setActiveInfoModal}
            showToast={showToast}
            onToggleFavorite={onToggleFavorite}
            product={product}
            isFav={isFav}
            stats={stats}
          />
        </div>
      </div>

      {/* ── DESKTOP PRODUCT SECTION (Two separate blocks, >= lg) ── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-stretch">
        
        {/* BLOCK 1: Gallery & Product Details (9 cols on lg) */}
        <div className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col justify-between h-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
            
            {/* COLUMN 1: IMAGE GALLERY */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <ProductGallery
                product={product}
                allImages={allImages}
                activeImageIndex={activeImageIndex}
                setActiveImageIndex={setActiveImageIndex}
                openZoomModal={openZoomModal}
                scrollThumbs={scrollThumbs}
                thumbsRef={thumbsRef}
                discount={discount}
                getIpxImageUrl={getIpxImageUrl}
                FALLBACK_PRODUCT_IMAGE={FALLBACK_PRODUCT_IMAGE}
                markImageFailed={markImageFailed}
              />
            </div>

            {/* COLUMN 2: SPECS, RATING & OPTIONS */}
            <div className="md:col-span-5 flex flex-col space-y-6">
              <ProductHeaderInfo
                product={product}
                reviewsMeta={reviewsMeta}
                articleNum={articleNum}
                setActiveTab={setActiveTab}
                scrollToSection={scrollToSection}
              />

              <ProductSpecsPreview
                optionsConfig={optionsConfig}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                parsedSpecs={parsedSpecs}
                setActiveTab={setActiveTab}
                scrollToSection={scrollToSection}
                formatPrice={formatPrice}
                product={product}
              />
            </div>

          </div>

          {/* Engagement Metrics footer at bottom of BLOCK 1 */}
          <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Смотрят сейчас:</span>
              <span className="text-emerald-600 font-bold">
                {stats.watching || 1} человек
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-bold">{stats.views || 0}</span>
            </div>
          </div>
        </div>

        {/* BLOCK 2: Sticky Buy Box (3 cols on lg) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-4 self-start lg:sticky lg:top-4">
          <ProductBuyBox
            product={product}
            activePromotion={activePromotion}
            promoDiscountPercentage={promoDiscountPercentage}
            showStrikethroughOldPrice={showStrikethroughOldPrice}
            totalOldPrice={totalOldPrice}
            totalMainPrice={totalMainPrice}
            effectivePrice={effectivePrice}
            displayQty={displayQty}
            cartQty={cartQty}
            cartItemForProduct={cartItemForProduct}
            selectedOption={selectedOption}
            inCart={inCart}
            handleAddToCartWithOption={handleAddToCartWithOption}
            handleBuyNow={handleBuyNow}
            onUpdateCartQuantity={onUpdateCartQuantity}
            onNavigate={onNavigate}
            formatPrice={formatPrice}
            onToggleFavorite={onToggleFavorite}
            isFav={isFav}
            handleShare={handleShare}
            showToast={showToast}
          />

          <ProductDeliveryAndActions
            userCity={userCity}
            setIsCityModalOpen={setIsCityModalOpen}
            deliveryInfo={deliveryInfo}
            estimatedDeliveryDateStr={estimatedDeliveryDateStr}
            setActiveInfoModal={setActiveInfoModal}
            showToast={showToast}
            onToggleFavorite={onToggleFavorite}
            product={product}
            isFav={isFav}
            handleShare={handleShare}
            stats={stats}
            hideMetrics={true}
          />
        </div>

      </div>

      {/* ── Service Info Badges (Aligned under the left card) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Badge 1: Нашли дешевле */}
            <div 
              onClick={() => setActiveInfoModal('lowPrice')}
              className="bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer group w-full h-full"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Coins className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">Нашли дешевле?</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Компенсируем 110% разницы</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Badge 2: Условия доставки */}
            <div 
              onClick={() => setActiveInfoModal('delivery')}
              className="bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer group w-full h-full"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Truck className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">Доставка и самовывоз</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Условия и способы оплаты</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Badge 3: Условия возврата */}
            <div 
              onClick={() => setActiveInfoModal('returns')}
              className="bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer group w-full h-full"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <RotateCcw className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">Возврат и обмен</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">14 дней на легкий возврат</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section with Tabs ── */}
      <div id="tabs-section" className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`py-3 px-1 font-extrabold text-[11px] sm:text-sm border-b-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'description'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Описание</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-1 font-extrabold text-[11px] sm:text-sm border-b-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'specs'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Характеристики</span>
            <span className="text-[10px] font-bold opacity-70">({parsedSpecs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-1 font-extrabold text-[11px] sm:text-sm border-b-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Отзывы</span>
            <span className="text-[10px] font-bold opacity-70">({reviewsMeta.total})</span>
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
            <div className="w-full space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 font-outfit mb-4">Технические характеристики</h3>
              {Object.keys(groupedSpecs).length > 0 ? (
                <div className="space-y-6 w-full">
                  {Object.entries(groupedSpecs).map(([groupName, items]) => (
                    <div key={groupName} className="flex flex-col sm:flex-row gap-2 sm:gap-8 border-b border-slate-100 pb-5 last:border-0 last:pb-0 w-full">
                      {/* Left Column: Group Header */}
                      <div className="text-slate-400 font-extrabold text-xs uppercase tracking-wider sm:w-56 shrink-0 sm:pt-1">
                        {groupName}
                      </div>
                      {/* Right Column: Dotted list of specs */}
                      <div className="flex-1 w-full space-y-3">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-baseline text-xs font-semibold leading-relaxed w-full min-w-0">
                            <span className="text-slate-500 shrink-0 pr-1 max-w-[45%] truncate" title={item.label}>{item.label}</span>
                            {item.value ? (
                              <>
                                <span className="border-b border-dotted border-slate-200 flex-grow mb-1 min-w-[20px]"></span>
                                <span className="text-slate-800 font-bold pl-1 shrink-0 break-words text-right max-w-[55%]">{item.value}</span>
                              </>
                            ) : null}
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
                {reviewsMeta.total > 0 ? (
                  <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center text-amber-400">
                      <Star className="h-5 w-5 fill-amber-400" />
                      <span className="ml-1.5 font-outfit text-xl font-black text-slate-900">
                        {product.rating ? Number(product.rating).toFixed(1) : '5.0'}
                      </span>
                    </div>
                    <span className="text-slate-200">|</span>
                    <span className="text-xs font-bold text-slate-500">
                      {reviewsMeta.total} {reviewsMeta.total === 1 ? 'отзыв' : [2, 3, 4].includes(reviewsMeta.total % 10) && ![12, 13, 14].includes(reviewsMeta.total % 100) ? 'отзыва' : 'отзывов'}
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-400">
                    0 отзывов
                  </div>
                )}
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

      {/* Companion & Related Materials Recommendation Carousel */}
      {recommendations.length > 0 && (
        <CartRecommendationsCarousel
          recommendations={recommendations}
          cart={cart}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateCartQuantity}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
          showToast={showToast}
          onNavigate={onNavigate}
        />
      )}

      {/* Info Modals */}
      <InfoModals
        isOpen={!!activeInfoModal}
        type={activeInfoModal}
        onClose={() => setActiveInfoModal(null)}
        showToast={showToast}
      />

      {/* City Selection Modal */}
      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        currentCity={userCity}
        onSelectCity={setUserCity}
      />

      {/* ── Single Unified Mobile Bottom Navigation Sheet (Buttons + Menu in ONE card) ── */}
      {createPortal(
        <nav className="fixed bottom-0 inset-x-0 z-[100] bg-white border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] lg:hidden pwa-bottom-nav">
          {/* Top Section: Action Buttons (Hidden during photo viewing) */}
          {!isZoomOpen && (
            <div className="p-2.5 px-3 sm:px-4 border-b border-slate-100/70">
            {!inCart ? (
              <div className="flex items-center gap-2.5 max-w-7xl mx-auto">
                <button
                  type="button"
                  onClick={handleAddToCartWithOption}
                  className="flex-1 bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-white font-extrabold h-12 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  <ShoppingCart className="h-4.5 w-4.5 shrink-0" />
                  <span>В корзину</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 bg-[#00a046] hover:bg-[#00883b] active:scale-95 text-white font-extrabold h-12 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Купить сейчас</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
                <div className="flex items-center bg-slate-900 rounded-xl h-12 px-1 justify-between shadow-sm shrink-0 w-36">
                  <button
                    type="button"
                    onClick={() => {
                      const optToUse = cartItemForProduct?.selectedOption || selectedOption;
                      if (cartQty === 1) onUpdateCartQuantity?.(product.id, 0, optToUse);
                      else onUpdateCartQuantity?.(product.id, cartQty - 1, optToUse);
                    }}
                    className="w-9 h-full flex items-center justify-center text-white/70 hover:text-white rounded-lg active:scale-90 text-xl font-bold cursor-pointer shrink-0"
                  >
                    −
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-1 h-full min-w-0">
                    <ShoppingCart className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-extrabold text-white text-sm font-mono truncate">
                      {cartQty}
                    </span>
                    <span className="text-white/60 text-xs font-normal shrink-0">шт</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const optToUse = cartItemForProduct?.selectedOption || selectedOption;
                      onUpdateCartQuantity?.(product.id, cartQty + 1, optToUse);
                    }}
                    className="w-9 h-full flex items-center justify-center text-white/70 hover:text-white rounded-lg active:scale-90 text-xl font-bold cursor-pointer shrink-0"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate?.('cart')}
                  className="flex-1 bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-white font-extrabold h-12 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Перейти в корзину</span>
                </button>
              </div>
            )}
          </div>
          )}

          {/* Bottom Section: Nav Menu Icons */}
          <div className="grid grid-cols-5 h-14 items-center px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.label}
                  onClick={item.action}
                  className={`flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
                    active
                      ? item.isAi
                        ? 'text-emerald-600 font-bold'
                        : 'text-blue-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`h-5 w-5 ${active && item.isAi ? 'animate-pulse' : ''}`}
                      strokeWidth={active ? 2.3 : 1.8}
                    />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white font-black text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm font-mono border-2 border-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium leading-none tracking-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>,
        document.body
      )}

      {/* Fullscreen Kaspi-Style Photo Lightbox / Zoom Modal */}
      {isZoomOpen && createPortal(
        <div 
          className="fixed inset-0 z-[80] bg-white flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none"
          onClick={closeZoomModal}
        >
          {/* Top Bar: Counter & Close Button */}
          <div className="flex items-center justify-between z-30 w-full pt-1 px-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-black text-slate-400 font-mono">
              {modalImageIndex + 1} / {allImages.length}
            </span>

            <button
              type="button"
              onClick={closeZoomModal}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all cursor-pointer shadow-xs border border-slate-200/60"
              title="Закрыть"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Left Navigation Arrow (Desktop only) */}
          {allImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
              }}
              className="hidden sm:flex fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shadow-md"
              title="Предыдущее фото"
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.5} />
            </button>
          )}

          {/* Center Main Large Fullscreen Image with Touch Swipe */}
          <div 
            className="flex-1 flex flex-col items-center justify-center relative my-auto p-2 w-full min-h-0 touch-pan-y" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleModalTouchStart}
            onTouchMove={handleModalTouchMove}
            onTouchEnd={handleModalTouchEnd}
          >
            <img
              src={getIpxImageUrl(allImages[modalImageIndex] || activeImage, '1200x1200')}
              alt={product?.name || 'Фото товара'}
              className="w-full h-full object-contain transition-all duration-300 pointer-events-none select-none"
              onError={(e) => {
                const targetImg = allImages[modalImageIndex] || activeImage;
                if (e.target.src !== targetImg && targetImg) {
                  e.target.src = targetImg;
                } else {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_PRODUCT_IMAGE;
                }
              }}
            />
          </div>

          {/* Right Navigation Arrow (Desktop only) */}
          {allImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
              }}
              className="hidden sm:flex fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shadow-md"
              title="Следующее фото"
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.5} />
            </button>
          )}

          {/* Bottom Thumbnails Strip (Kaspi Style with Red Active Border) */}
          {allImages.length > 1 && (
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-2 mb-16 sm:mb-0 z-30 hide-scrollbar w-full max-w-4xl mx-auto shrink-0" onClick={(e) => e.stopPropagation()}>
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setModalImageIndex(i)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl overflow-hidden p-1 transition-all shrink-0 cursor-pointer ${
                    modalImageIndex === i
                      ? 'border-2 border-red-500 shadow-md scale-105'
                      : 'border border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getIpxImageUrl(img, '200x200')}
                    alt={`фото ${i + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      if (e.target.src !== img && img) {
                        e.target.src = img;
                      } else {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_PRODUCT_IMAGE;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
