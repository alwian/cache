export interface CacheItem {
  key: string;
  value: unknown;
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
  initialData?: CacheItem[];
  removeOnExpire: boolean;
  expireOnce: boolean;
  capacity: number;
  errorOnFull: boolean;
  errorOnMiss: boolean;
  errorOnDuplicate: boolean;
}
