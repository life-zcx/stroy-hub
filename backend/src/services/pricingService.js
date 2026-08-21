import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import { invalidateProductsCache } from '../utils/cacheRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pricingSettingsPath = path.join(process.cwd(), 'config', 'pricing_settings.json');
const legacyPricingSettingsPath = path.join(__dirname, '..', 'config', 'pricing_settings.json');

export const DEFAULT_PRICING_SETTINGS = {
  markups: {
    mixes: 15,
    lumber: 12,
    tools: 20,
    paints: 18,
    hardware: 25
  },
  overrides: {},
  logisticsPercent: 5,
  acquiringPercent: 2,
  cashbackPercent: 3,
  promoCoveragePercent: 30,
  promoDiscountPercent: 10,
  taxPercent: 0
};

// In-memory cache for pricing settings
let memoryPricingSettings = null;
let memoryCacheVersion = 1;
let lastVersionFetchTime = 0;

/**
 * Get current product cache version from Redis or memory (O(1))
 */
export async function getProductsCacheVersion() {
  const now = Date.now();
  if (now - lastVersionFetchTime < 5000) {
    return memoryCacheVersion;
  }

  try {
    const v = await redisClient.get('products:cache_version');
    if (v) {
      memoryCacheVersion = parseInt(v, 10) || 1;
    } else {
      await redisClient.set('products:cache_version', '1');
      memoryCacheVersion = 1;
    }
    lastVersionFetchTime = now;
  } catch (err) {
    logger.warn(`Failed to fetch product cache version from Redis: ${err.message}`);
  }
  return memoryCacheVersion;
}

/**
 * Generate a versioned Redis cache key for products (O(1) invalidation ready)
 */
export async function getVersionedProductsCacheKey(prefix, payload = '') {
  const version = await getProductsCacheVersion();
  const serialized = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
  return `products:v${version}:${prefix}:${serialized}`;
}

/**
 * Instantly invalidate product cache in Redis in O(1) time by incrementing the cache version
 */
export async function clearProductsCache() {
  memoryPricingSettings = null; // Clear RAM pricing cache
  try {
    const newVersion = await redisClient.incr('products:cache_version');
    memoryCacheVersion = newVersion;
    lastVersionFetchTime = Date.now();
    logger.info(`Product cache invalidated instantly (version bumped to ${newVersion})`);
    
    // Invalidate tagged cache keys in Redis
    await invalidateProductsCache();

    // Notify AI service asynchronously to reset catalog cache
    notifyAiServiceCacheReset().catch(err => logger.warn(`AI Service cache reset ping failed: ${err.message}`));
  } catch (err) {
    logger.error('Error invalidating products cache version in Redis:', err);
  }
}

/**
 * Read pricing settings with RAM caching (non-blocking)
 */
export function readPricingSettings() {
  if (memoryPricingSettings) {
    return memoryPricingSettings;
  }

  try {
    const targetPath = fs.existsSync(pricingSettingsPath) ? pricingSettingsPath : legacyPricingSettingsPath;
    if (fs.existsSync(targetPath)) {
      const data = fs.readFileSync(targetPath, 'utf8');
      const parsed = JSON.parse(data);
      memoryPricingSettings = {
        ...DEFAULT_PRICING_SETTINGS,
        ...parsed,
        markups: { ...DEFAULT_PRICING_SETTINGS.markups, ...(parsed.markups || {}) },
        overrides: { ...DEFAULT_PRICING_SETTINGS.overrides, ...(parsed.overrides || {}) }
      };
      return memoryPricingSettings;
    }
  } catch (error) {
    logger.error('Error reading pricing settings from file:', error);
  }

  memoryPricingSettings = DEFAULT_PRICING_SETTINGS;
  return memoryPricingSettings;
}

/**
 * Write pricing settings asynchronously and invalidate RAM & Redis cache
 */
export async function writePricingSettings(settings) {
  try {
    const dir = path.dirname(pricingSettingsPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(pricingSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
    memoryPricingSettings = { ...settings };
    await clearProductsCache();
    return true;
  } catch (error) {
    logger.error('Error writing pricing settings:', error);
    return false;
  }
}

export function calculatePriceBottomUp(wholesalePrice, activeMarkup, settings) {
  const logisticsPercent = settings.logisticsPercent !== undefined ? settings.logisticsPercent : 5;
  const acquiringPercent = settings.acquiringPercent !== undefined ? settings.acquiringPercent : 2;
  const cashbackPercent = settings.cashbackPercent !== undefined ? settings.cashbackPercent : 3;
  const promoCoveragePercent = settings.promoCoveragePercent !== undefined ? settings.promoCoveragePercent : 30;
  const promoDiscountPercent = settings.promoDiscountPercent !== undefined ? settings.promoDiscountPercent : 10;
  const taxPercent = settings.taxPercent !== undefined ? settings.taxPercent : 3;

  const logisticsAmount = wholesalePrice * (logisticsPercent / 100);
  const acquiringAmount = wholesalePrice * (acquiringPercent / 100);
  const cashbackAmount = wholesalePrice * (cashbackPercent / 100);
  const promoAmount = wholesalePrice * (promoCoveragePercent / 100) * (promoDiscountPercent / 100);
  const taxAmount = wholesalePrice * (taxPercent / 100);

  const breakEven = wholesalePrice + logisticsAmount + acquiringAmount + cashbackAmount + promoAmount + taxAmount;
  const profitAmount = breakEven * (activeMarkup / 100);
  const retailPrice = breakEven + profitAmount;

  return Math.round(retailPrice);
}

export function resolveCategoryMarkup(product, markups, categoryMap, categorySlugMap) {
  let cat = null;
  if (product.categoryId) {
    cat = categoryMap.get(product.categoryId);
  } else if (product.category) {
    cat = categorySlugMap.get(product.category);
  }

  while (cat) {
    if (markups[cat.id] !== undefined) {
      return markups[cat.id];
    }
    if (markups[cat.slug] !== undefined) {
      return markups[cat.slug];
    }
    cat = cat.parentId ? categoryMap.get(cat.parentId) : null;
  }
  return 15; // Default markup
}

export function applyRetailPricingToProduct(product, settings, categoryMap, categorySlugMap) {
  const { markups, overrides } = settings;
  const wholesalePrice = product.price;
  const categoryMarkup = resolveCategoryMarkup(product, markups, categoryMap, categorySlugMap);
  const activeMarkup = overrides[product.id] !== undefined ? overrides[product.id] : categoryMarkup;
  const retailPrice = calculatePriceBottomUp(wholesalePrice, activeMarkup, settings);
  const effectiveCashback = product.cashbackPercent ?? product.categoryRelation?.cashbackPercent ?? 3;

  let mappedOptions = product.options;
  if (product.options && typeof product.options === 'object' && Array.isArray(product.options.items)) {
    const items = product.options.items.map(item => {
      if (item.price !== undefined && item.price !== null && item.price !== '' && !isNaN(parseFloat(item.price))) {
        const itemWholesale = parseFloat(item.price);
        const itemRetail = calculatePriceBottomUp(itemWholesale, activeMarkup, settings);
        return {
          ...item,
          wholesalePrice: itemWholesale,
          price: itemRetail
        };
      }
      return item;
    });
    mappedOptions = {
      ...product.options,
      items
    };
  }

  const wholesaleOldPrice = product.oldPrice;
  const retailOldPrice = product.oldPrice ? calculatePriceBottomUp(product.oldPrice, activeMarkup, settings) : null;

  return {
    ...product,
    wholesalePrice,
    wholesaleOldPrice,
    price: retailPrice,
    oldPrice: retailOldPrice,
    cashbackPercent: effectiveCashback,
    options: mappedOptions,
  };
}

async function notifyAiServiceCacheReset() {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:5005';
  try {
    await fetch(`${aiServiceUrl}/api/ai/reset-cache`, { method: 'POST' });
  } catch (err) {
    // Ignore ping failure if AI service is not running or unreachable
  }
}
