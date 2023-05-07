import { EventEmitter } from "events";

class DataCache extends EventEmitter {
  #data: Record<string, CachedItem> = {};

  #stats: CacheStats = {
    accesses: 0
  };

  #config: Omit<CacheConfig, "initialData"> = {
    interval: 1
  };

  #expiryInterval: NodeJS.Timeout | undefined;

  constructor(config?: CacheConfig) {
    super();
    const timeAdded = Date.now();

    if (config) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initialData, ...otherConfig } = config;
      this.#config = { ...this.#config, ...otherConfig };

      config.initialData?.forEach((item: CacheItem) => {
        this.#data[item.key] = { ...item, timeAdded, stats: { accesses: 0 } };
      });
    }
    this.#resetExpiryInterval();
  }

  #resetExpiryInterval() {
    clearInterval(this.#expiryInterval);

    if (this.#config.interval) {
      this.#expiryInterval = setInterval(() => {
        const time = Date.now();

        Object.keys(this.#data).forEach((key: string) => {
          const ttl = this.#data[key].ttl || this.#config.defaultTtl;
          if (ttl && time - this.#data[key].timeAdded >= ttl * 1000) {
            const keyCopy = key;
            const valueCopy = this.#data[key]?.value;
            delete this.#data[key];

            this.emit("expire", keyCopy, valueCopy);
          }
        });
      }, (this.#config.interval as number) * 1000);
    }
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
      this.emit("get", key, items[key]);
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
      this.emit("set", item.key, item.value);
    });
  }

  remove(...keys: string[]) {
    keys.forEach((key: string) => {
      const keyCopy = key;
      const valueCopy = this.#data[key]?.value;
      delete this.#data[key];

      this.emit("remove", keyCopy, valueCopy);
    });
  }

  pop(...keys: string[]): unknown | Record<string, unknown> {
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.#data[key]?.value;
      delete this.#data[key];

      this.emit("pop", key, items[key]);
    });

    if (keys.length === 1) {
      return items[keys[0]];
    }
    return items;
  }

  clear() {
    this.#data = {};
    this.emit("clear");
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

  config(config: Omit<CacheConfig, "initialData">) {
    this.#config = {
      ...this.#config,
      ...config
    };
    this.#resetExpiryInterval();
  }

  ttl(ttl: number, ...keys: string[]) {
    if (!keys.length) {
      keys = Object.keys(this.#data);
    }

    Object.values(this.#data).forEach((item: CachedItem) => {
      item.ttl = ttl;
    });
  }
}

export default DataCache;
