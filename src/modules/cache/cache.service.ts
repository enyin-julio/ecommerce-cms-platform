export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class NoopCacheStore implements CacheStore {
  async get<T>(): Promise<T | null> {
    return null;
  }

  async set(): Promise<void> {
    return;
  }

  async delete(): Promise<void> {
    return;
  }
}

export const cacheStore: CacheStore = new NoopCacheStore();
