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

  constructor(initialData?: Record<string, CacheItem>) {
    if (initialData) {
      const timeAdded = Date.now();
      Object.keys(initialData).forEach((key: string) => {
        this.#data[key] = { ...initialData[key], timeAdded };
      });
    }
  }

  get(key: string) {
    return this.#data[key]?.value;
  }

  set(key: string, data: CacheItem) {
    this.#data[key] = { ...data, timeAdded: Date.now() };
  }

  remove(key: string) {
    delete this.#data[key];
  }
}

export default DataCache;
