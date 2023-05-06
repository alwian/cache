class DataCache {
  #data: Record<string, CachedItem> = {};

  #counter = setInterval(() => {
    const time = Date.now();

    Object.keys(this.#data).forEach((key: string) => {
      const ttl = this.#data[key].ttl;
      if (ttl && time - this.#data[key].timeAdded >= ttl * 1000) {
        this.remove(key);
      }
    });
  }, 1000);

  constructor(...initialData: CacheItem[]) {
    const timeAdded = Date.now();
    initialData?.forEach((item: CacheItem) => {
      this.#data[item.key] = { ...item, timeAdded };
    });
  }

  get(...keys: string[]): unknown | Record<string, unknown> {
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.#data[key]?.value;
    });

    if (keys.length === 1) {
      return items[keys[0]];
    }
    return items;
  }

  set(...items: CacheItem[]) {
    const timeAdded = Date.now();
    items.forEach((item: CacheItem) => {
      this.#data[item.key] = { ...item, timeAdded };
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
}

export default DataCache;
