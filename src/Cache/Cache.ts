import { EventEmitter } from "events";
import { CacheConfig, CacheItem, ItemDetails, ItemStats } from "../types";
import { checkDuplicateKeys, checkMissingKeys } from "../utils";

export default class Cache extends EventEmitter {
  #data: Record<string, unknown> = {};
  #itemDetails: Record<string, ItemDetails> = {};

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

  /**
   * Create a cache.
   *
   * @param config Custom config to use.
   */
  constructor(config?: Partial<CacheConfig>) {
    super();
    const timeAdded = Date.now();

    if (config) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initialData, ...otherConfig } = config;
      this.#config = { ...this.#config, ...otherConfig };

      config.initialData?.forEach((item: CacheItem) => {
        this.#data[item.key] = item.value;
        this.#itemDetails[item.key] = {
          ttl: item.ttl,
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
          if (this.#itemDetails[key].expired && this.#config.expireOnce) {
            return;
          }

          const ttl = this.#itemDetails[key].ttl || this.#config.defaultTtl;
          if (
            this.#itemDetails[key].expired ||
            (ttl && time - this.#itemDetails[key].timeAdded >= ttl * 1000)
          ) {
            const keyCopy = key;
            const valueCopy = this.#data[key];

            if (this.#config.removeOnExpire) {
              delete this.#data[key];
              delete this.#itemDetails[key];
            } else {
              this.#itemDetails[key].expired = true;
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
    if (this.#config.errorOnMiss) {
      checkMissingKeys(this.keys(), keys);
    }

    if (!keys.length) {
      keys = this.keys();
    } else if (keys.length === 1) {
      if (this.#data[keys[0]]) {
        this.#itemDetails[keys[0]].stats.accesses += 1;
      }
      this.emit("get", keys[0], this.#data[keys[0]]);
      return this.#data[keys[0]];
    }

    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      if (this.#data[key]) {
        items[key] = this.#data[key];
        if (items[key]) this.#itemDetails[key].stats.accesses += 1;
      }
      this.emit("get", key, this.#data[key]);
    });
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
      checkDuplicateKeys(
        this.keys(),
        items.map((item: CacheItem) => item.key)
      );
    }

    if (
      this.keys().length + items.length > this.#config.capacity &&
      this.#config.errorOnFull
    ) {
      throw Error("Could not add items as capacity would be exceeded.");
    }

    const timeAdded = Date.now();
    for (const item of items) {
      if (this.size() === this.#config.capacity) {
        break;
      }

      this.#data[item.key] = item.value;
      this.#itemDetails[item.key] = {
        ttl: item.ttl,
        timeAdded,
        stats: { accesses: 0 },
        expired: false
      };
      this.emit("set", item.key, item.value);
    }
  }

  /**
   * Remove items from the cache.
   *
   * A `remove` event is emitted for each item removed.
   *
   * @param keys The keys of the items to remove. If not keys specified then all items will be removed.
   */
  remove(...keys: string[]): void {
    if (this.#config.errorOnMiss) {
      checkMissingKeys(this.keys(), keys);
    }

    if (!keys.length) {
      keys = this.keys();
    }

    keys.forEach((key: string) => {
      const keyCopy = key;
      const valueCopy = this.#data[key];
      delete this.#data[key];
      delete this.#itemDetails[key];

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
    if (this.#config.errorOnMiss) {
      checkMissingKeys(this.keys(), keys);
    }

    if (!keys.length) {
      keys = this.keys();
    } else if (keys.length === 1) {
      const value = this.#data[keys[0]];
      delete this.#data[keys[0]];
      delete this.#itemDetails[keys[0]];
      this.emit("pop", keys[0], value);
      return value;
    }

    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.#data[key];
      delete this.#data[key];
      delete this.#itemDetails[key];
      this.emit("pop", key, items[key]);
    });

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
   *
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
    if (this.#config.errorOnMiss) {
      checkMissingKeys(this.keys(), keys);
    }

    if (!keys.length) {
      keys = this.keys();
    } else if (keys.length === 1) {
      return this.#itemDetails[keys[0]]?.stats;
    }

    const stats: Record<string, ItemStats> = {};
    keys.forEach((key: string) => {
      if (this.#data[key]) {
        stats[key] = this.#itemDetails[key].stats;
      }
    });

    return stats;
  }

  /**
   * Reset the stats of items.
   *
   * @param keys The keys to reset the stats of. If no keys specified all items will be reset.
   */
  clearStats(...keys: string[]): void {
    if (this.#config.errorOnMiss) {
      checkMissingKeys(this.keys(), keys);
    }

    if (!keys.length) {
      keys = this.keys();
    }

    this.keys().forEach((key: string) => {
      this.#itemDetails[key].stats = {
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
    if (this.#config.errorOnMiss) {
      checkMissingKeys(this.keys(), keys);
    }

    if (!keys.length) {
      keys = this.keys();
    }

    keys.forEach((key: string) => {
      if (this.#itemDetails[key]) {
        this.#itemDetails[key].ttl = ttl;
      }
    });
  }

  /**
   * Remove all expired data from the cache.
   *
   * Useful for when `removeOnExpire` is `false` but you want to remove expired data.
   */
  purge(): void {
    for (const [key, value] of Object.entries(this.#itemDetails)) {
      const ttl = value.ttl || this.#config.defaultTtl;
      const time = Date.now();
      if (ttl && time - value.timeAdded >= ttl * 1000) {
        delete this.#data[key];
        delete this.#itemDetails[key];
      }
    }
  }

  /**
   * Resets the time before an item expires.
   *
   * @param keys The items to reset. If no keys specified all items will be affected.
   */
  resetExpiry(...keys: string[]): void {
    if (this.#config.errorOnMiss) {
      checkMissingKeys(this.keys(), keys);
    }

    if (!keys.length) {
      keys = this.keys();
    }

    const time = Date.now();
    keys.forEach((key: string) => {
      if (this.#data[key]) {
        this.#itemDetails[key].timeAdded = time;
        this.#itemDetails[key].expired = false;
      }
    });
  }

  /**
   * Get each value stored in the cache.
   *
   * @returns An array containing each value stored.
   */
  values(): unknown[] {
    return Object.values(this.#data);
  }

  /**
   * Get each key/value pair stored in the cache.
   *
   * @returns An array in the format of `[[key, value],...]`.
   */
  entries(): [string, unknown][] {
    return Object.entries(this.#data);
  }

  /**
   * Get the number of items in the cache.
   */
  size(): number {
    return this.keys().length;
  }
}
