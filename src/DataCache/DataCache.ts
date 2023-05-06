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

  constructor(initialData?: CacheItem[]) {
    const timeAdded = Date.now();
    initialData?.forEach((item: CacheItem) => {
      this.#data[item.key] = { ...item, timeAdded };
    });
  }

  get(key: string) {
    return this.#data[key]?.value;
  }

  getMultiple(keys: string[]) {
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.#data[key].value;
    });
    return items;
  }

  set(data: CacheItem) {
    this.#data[data.key] = { ...data, timeAdded: Date.now() };
  }

  setMultiple(items: CacheItem[]) {
    const timeAdded = Date.now();
    items.forEach((item: CacheItem) => {
      this.#data[item.key] = { ...item, timeAdded };
    });
  }

  remove(key: string) {
    delete this.#data[key];
  }

  pop(key: string) {
    const item = this.#data[key].value;
    delete this.#data[key];

    return item;
  }

  popMultiple(keys: string[]) {
    const items: Record<string, unknown> = {};
    keys.forEach((key: string) => {
      items[key] = this.pop(key);
    });
    return items;
  }
}

export default DataCache;
