import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Retrieves an item from the cache.
   * Returns a Promise so it matches Redis/asynchronous cache interfaces.
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Stores an item in the cache with a specific TTL in milliseconds.
   */
  async set(key: string, value: any, ttlMs: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidates / deletes a specific cache key.
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clears the entire in-memory store.
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
}
