interface CacheItem {
  value: string;
  ttl?: number;
}

interface CachedItem extends CacheItem {
  timeAdded: number;
}
