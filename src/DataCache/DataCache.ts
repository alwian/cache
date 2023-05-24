import { EventEmitter } from "events";

export default class DataCache extends EventEmitter {
  #data: Record<string, CachedItem> = {};

  #stats: CacheStats = {
    accesses: 0,
    misses: 0
  };

  #config: Omit<CacheConfig, "initialData"> = {
    interval: 1,
    removeOnExpire: true,
    expireOnce: true,
    capacity: Infinity,
    errorOnFull: false,
    defaultTtl: 0,
    errorOnMiss: false,
    errorOnDuplicate: false
  };

  #expiryInterval: NodeJS.Timeout | undefined;

  constructor(config?: Partial<CacheConfig>) {
    super();
    const timeAdded = Date.now();

    if (config) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initialData, ...otherConfig } = config;
      this.#config = { ...this.#config, ...otherConfig };

      config.initialData?.forEach((item: CacheItem) => {
        this.#data[item.key] = {
          ...item,
          timeAdded,
          stats: { accesses: 0 },
          expired: false
        };
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
          if (this.#data[key].expired && this.#config.expireOnce) {
            return;
          }

          const ttl = this.#data[key].ttl || this.#config.defaultTtl;
          if (
            this.#data[key].expired ||
            (ttl && time - this.#data[key].timeAdded >= ttl * 1000)
          ) {
            const keyCopy = key;
            const valueCopy = this.#data[key]?.value;

            if (this.#config.removeOnExpire) {
              delete this.#data[key];
            } else {
              this.#data[key].expired = true;
            }

            this.emit("expire", keyCopy, valueCopy);
          }
        });
      }, (this.#config.interval as number) * 1000);
    }
  }

  /**
   * Retrieve items from the cache.
   *
   * A `get` event is triggered for each item retrieved.
   *
   * @param keys The keys to return. If no keys are specified then all items will be returned.
   * @returns Either the item for the specified key, an object containing all items if no keys specified, or an object containing the keys specified if >1 provided.
   */
  get(...keys: string[]): unknown | Record<string, unknown> {
    if (!keys.length) {
      keys = this.keys();
    }
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.#data[key]?.value;
      if (this.#data[key] !== undefined) {
        this.#data[key].stats.accesses += 1;
        this.#stats.accesses += 1;
      } else {
        this.#stats.misses += 1;

        if (this.#config.errorOnMiss) {
          throw Error(`Key ${key} is undefined.`);
        }
      }
      this.emit("get", key, items[key]);
    });

    if (keys.length === 1) {
      return items[keys[0]];
    }
    return items;
  }

  /**
   * Add items to the cache.
   *
   * A `set` event is triggered for each item added.
   *
   * @param items The items to store.
   */
  set(...items: CacheItem[]): void {
    if (this.#config.errorOnDuplicate) {
      items.forEach((item: CacheItem) => {
        if (this.#data[item.key] !== undefined) {
          throw Error(`Cannot add existing key ${item.key}`);
        }
      });
    }

    if (this.keys().length + items.length > this.#config.capacity) {
      if (this.#config.errorOnFull) {
        throw Error("Could not add items as capacity would be exceeded");
      } else {
        return;
      }
    }

    const timeAdded = Date.now();
    items.forEach((item: CacheItem) => {
      this.#data[item.key] = {
        ...item,
        timeAdded,
        stats: { accesses: 0 },
        expired: false
      };
      this.emit("set", item.key, item.value);
    });
  }

  /**
   * Remove items from the cache.
   *
   * A `remove` event is emitted for each item removed.
   *
   * @param keys The keys of the items to remove. If not keys specified then all items will be removed.
   */
  remove(...keys: string[]): void {
    if (!keys.length) {
      keys = this.keys();
    }

    keys.forEach((key: string) => {
      const keyCopy = key;
      const valueCopy = this.#data[key]?.value;
      delete this.#data[key];

      this.emit("remove", keyCopy, valueCopy);
    });
  }

  /**
   * Retrieve and remove items from the cache.
   *
   * A `pop` event is triggered for each item retrieved.
   *
   * @param keys The keys to retrieve. If no keys are specified then all items will be returned.
   * @returns Either the item for the specified key, an object containing all items if no keys specified, or an object containing the keys specified if >1 provided.
   */
  pop(...keys: string[]): unknown | Record<string, unknown> {
    if (!keys.length) {
      keys = this.keys();
    }
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      if (this.#config.errorOnMiss && !this.#data[key]) {
        throw Error(`Key ${key} is undefined.`);
      }

      items[key] = this.#data[key]?.value;
    });

    Object.keys(items).forEach((key: string) => {
      delete this.#data[key];
      this.emit("pop", key, items[key]);
    });

    if (keys.length === 1) {
      return items[keys[0]];
    }
    return items;
  }

  /**
   * Remove all items from the cache.
   *
   * Emits a `clear` event when called.
   */
  clear(): void {
    this.#data = {};
    this.emit("clear");
  }

  /**
   * Check whether a key exists in the cache.
   *
   * @param key The key to check.
   * @returns Whether the given key exists in the cache.
   */
  has(key: string): boolean {
    return this.keys().includes(key);
  }

  /**
   * Get all keys in the cache.
   * @returns The keys that exist in the cache.
   */
  keys(): string[] {
    return Object.keys(this.#data);
  }

  /**
   * Get the stats for items in the cache.
   *
   * @param keys The keys to retrieve stats for.
   * @returns Either the stats for a given key, an object containing stats for each key provided is >1 specified, or cumulative stats for the entire cache if no keys given.
   */
  stats(...keys: string[]): ItemStats | Record<string, ItemStats> {
    if (!keys.length) {
      keys = this.keys();
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

  /**
   * Reset the stats of items.
   *
   * @param keys The keys to reset the stats of. If no keys specified all items will be reset.
   */
  clearStats(...keys: string[]): void {
    if (!keys.length) {
      keys = this.keys();
    }

    this.keys().forEach((key: string) => {
      this.#data[key].stats = {
        accesses: 0
      };
    });
  }

  /**
   * Update the config used by the cache.
   *
   * @param config A new config to merge with the current config.
   */
  config(config: Partial<Omit<CacheConfig, "initialData">>): void {
    this.#config = {
      ...this.#config,
      ...config
    };
    this.#resetExpiryInterval();
  }

  /**
   * Update the ttl of an item.
   *
   * @param ttl The new ttl to use.
   * @param keys The items to update. If no items specified then all items will be affected.
   */
  ttl(ttl: number, ...keys: string[]): void {
    if (!keys.length) {
      keys = this.keys();
    }

    Object.values(this.#data).forEach((item: CachedItem) => {
      item.ttl = ttl;
    });
  }

  /**
   * Remove all expired data from the cache.
   *
   * Useful for when `removeOnExpire` is `false` but you want to remove expired data.
   */
  purge(): void {
    for (const [key, value] of Object.entries(this.#data)) {
      const ttl = value.ttl || this.#config.defaultTtl;
      const time = Date.now();
      if (ttl && time - value.timeAdded >= ttl * 1000) {
        delete this.#data[key];
      }
    }
  }

  /**
   * Resets the time before an item expires.
   *
   * @param keys The items to reset. If no keys specified all items will be affected.
   */
  resetExpiry(...keys: string[]): void {
    if (!keys.length) {
      keys = this.keys();
    }

    const time = Date.now();
    keys.forEach((key: string) => {
      this.#data[key].timeAdded = time;
      this.#data[key].expired = false;
    });
  }

  /**
   * Get each value stored in the cache.
   *
   * @returns An array containing each value stored.
   */
  values(): unknown[] {
    return Object.values(this.#data).map((item: CacheItem) => item.value);
  }

  /**
   * Get each key/value pair stored in the cache.
   *
   * @returns An array in the format of `[[key, value],...]`.
   */
  entries(): [string, unknown][] {
    return this.keys().map((key: string) => [key, this.#data[key].value]);
  }
}
