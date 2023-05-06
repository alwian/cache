class DataCache {
  #data: Record<string, CachedItem> = {};

  #stats: CacheStats = {
    accesses: 0
  };

  #config: Omit<CacheConfig, "initialData"> = {
    interval: 1
  };

  constructor(config?: CacheConfig) {
    const timeAdded = Date.now();

    if (config) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initialData, ...otherConfig } = config;
      this.#config = { ...this.#config, ...otherConfig };

      config.initialData?.forEach((item: CacheItem) => {
        this.#data[item.key] = { ...item, timeAdded, stats: { accesses: 0 } };
      });
    }

    setInterval(() => {
      const time = Date.now();

      Object.keys(this.#data).forEach((key: string) => {
        const ttl = this.#data[key].ttl || this.#config.defaultTtl;
        if (ttl && time - this.#data[key].timeAdded >= ttl * 1000) {
          this.remove(key);
        }
      });
    }, (this.#config.interval as number) * 1000);
  }

  get(...keys: string[]): unknown | Record<string, unknown> {
    if (!keys.length) {
      keys = Object.keys(this.#data);
    }
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.#data[key]?.value;
      if (this.#data[key] !== undefined) {
        this.#data[key].stats.accesses += 1;
        this.#stats.accesses += 1;
      }
    });

    if (keys.length === 1) {
      return items[keys[0]];
    }
    return items;
  }

  set(...items: CacheItem[]) {
    const timeAdded = Date.now();
    items.forEach((item: CacheItem) => {
      this.#data[item.key] = { ...item, timeAdded, stats: { accesses: 0 } };
    });
  }

  remove(...keys: string[]) {
    keys.forEach((key: string) => {
      delete this.#data[key];
    });
  }

  pop(...keys: string[]): unknown | Record<string, unknown> {
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.#data[key]?.value;
      delete this.#data[key];
    });

    if (keys.length === 1) {
      return items[keys[0]];
    }
    return items;
  }

  clear() {
    this.#data = {};
  }

  has(key: string) {
    return Object.keys(this.#data).includes(key);
  }

  keys() {
    return Object.keys(this.#data);
  }

  stats(...keys: string[]): CacheStats | ItemStats | Record<string, ItemStats> {
    if (!keys.length) {
      return this.#stats;
    }

    if (keys.length === 1) {
      return this.#data[keys[0]].stats;
    }

    const stats: Record<string, ItemStats> = {};
    keys.forEach((key: string) => {
      stats[key] = this.#data[key].stats;
    });

    return stats;
  }
}

export default DataCache;
