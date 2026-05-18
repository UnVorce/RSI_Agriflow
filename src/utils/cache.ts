import redisClient from '../config/redis';
import logger from './logger';

export class CacheService {
  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache data with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Cache wrapper for functions
   */
  static async wrap<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Session management
   */
  static async setSession(userId: string, data: any, ttlSeconds: number = 28800): Promise<void> {
    await this.set(`session:${userId}`, data, ttlSeconds);
  }

  static async getSession<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`session:${userId}`);
  }

  static async delSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  /**
   * Search cache management
   */
  static async setSearchCache(query: string, results: any, ttlSeconds: number = 600): Promise<void> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.set(key, results, ttlSeconds);
  }

  static async getSearchCache<T>(query: string): Promise<T | null> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return await this.get<T>(key);
  }

  /**
   * Invalidate user-related caches
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await this.delPattern(`*:${userId}:*`);
    await this.delSession(userId);
  }

  /**
   * Invalidate dashboard caches
   */
  static async invalidateDashboardCache(userId: string): Promise<void> {
    await this.del(`dashboard:${userId}`);
  }

  /**
   * Invalidate stock caches
   */
  static async invalidateStockCache(userId?: string): Promise<void> {
    if (userId) {
      await this.delPattern(`stock:${userId}*`);
    } else {
      await this.delPattern('stock:*');
    }
  }
}
