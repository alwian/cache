interface CacheItem {
  key: string;
  value: string;
  ttl?: number;
}

interface CachedItem extends CacheItem {
  timeAdded: number;
}
