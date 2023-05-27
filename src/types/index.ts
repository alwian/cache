export interface CacheItem {
  key: string;
  value: unknown;
  ttl?: number;
}

export interface CachedItem extends CacheItem {
  timeAdded: number;
  stats: ItemStats;
  expired: boolean;
}

export interface ItemStats {
  accesses: number;
}

export interface CacheStats {
  accesses: number;
  misses: number;
}

export interface CacheConfig {
  interval: number;
  defaultTtl: number;
  initialData?: CacheItem[];
  removeOnExpire: boolean;
  expireOnce: boolean;
  capacity: number;
  errorOnFull: boolean;
  errorOnMiss: boolean;
  errorOnDuplicate: boolean;
}
