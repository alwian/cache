interface CacheItem {
  key: string;
  value: string;
  ttl?: number;
}

interface CachedItem extends CacheItem {
  timeAdded: number;
  stats: ItemStats;
}

interface ItemStats {
  accesses: number;
}
interface CacheStats {
  accesses: number;
}
