interface CacheItem {
  key: string;
  value: unknown;
  ttl?: number;
}

interface CachedItem extends CacheItem {
  timeAdded: number;
  stats: ItemStats;
  expired: boolean;
}

interface ItemStats {
  accesses: number;
}
interface CacheStats {
  accesses: number;
}

interface CacheConfig {
  interval: number;
  defaultTtl: number;
  initialData?: CacheItem[];
  removeOnExpire: boolean;
  expireOnce: boolean;
  capacity: number;
  errorOnFull: boolean;
}
