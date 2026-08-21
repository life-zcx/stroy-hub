import redisClient from '../config/redis.js';
import logger from './logger.js';

/**
 * Reads a JSON cached object from Redis.
 */
export async function getCache(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.warn(`[Redis Cache Read Warning] Key ${key}: ${error.message}`);
    return null;
  }
}

/**
 * Stores data in Redis with expiration and registers tags for smart invalidation.
 */
export async function setCache(key, data, ttlSeconds = 1800, tags = []) {
  try {
    const payload = JSON.stringify(data);
    await redisClient.set(key, payload, { EX: ttlSeconds });

    if (Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        const tagKey = `cache:tag:${tag}`;
        await redisClient.sAdd(tagKey, key);
        await redisClient.expire(tagKey, ttlSeconds * 2);
      }
    }
  } catch (error) {
    logger.warn(`[Redis Cache Set Warning] Key ${key}: ${error.message}`);
  }
}

/**
 * Invalidates all cache entries associated with a specific tag.
 */
export async function invalidateCacheTag(tag) {
  try {
    const tagKey = `cache:tag:${tag}`;
    const keys = await redisClient.sMembers(tagKey);
    if (Array.isArray(keys) && keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`[Redis Tag Invalidation] Cleared ${keys.length} keys for tag "${tag}".`);
    }
    await redisClient.del(tagKey);
  } catch (error) {
    logger.warn(`[Redis Tag Invalidation Warning] Tag "${tag}": ${error.message}`);
  }
}

/**
 * Helper to invalidate all product & catalog related cache keys.
 */
export async function invalidateProductsCache() {
  await invalidateCacheTag('products');
  try {
    const keys = await redisClient.keys('products:*');
    if (Array.isArray(keys) && keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`[Redis Pattern Invalidation] Cleared ${keys.length} product keys.`);
    }
  } catch (err) {
    logger.warn(`[Redis Products Invalidation Error] ${err.message}`);
  }
}
