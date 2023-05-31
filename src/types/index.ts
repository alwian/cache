export interface CacheItem<K, T> {
  key: K;
  value: T;
  ttl?: number;
}

export interface ItemStats {
  accesses: number;
}

export interface ItemDetails {
  stats: ItemStats;
  expired: boolean;
  ttl?: number;
  timeAdded: number;
}
export interface CacheConfig {
  interval: number;
  defaultTtl: number;
  removeOnExpire: boolean;
  expireOnce: boolean;
  capacity: number;
  errorOnFull: boolean;
  errorOnMiss: boolean;
  errorOnDuplicate: boolean;
}
