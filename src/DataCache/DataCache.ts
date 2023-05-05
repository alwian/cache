class DataCache {
  #data: Record<string, CacheItem> = {};
  #timeouts: Record<string, number> = {};

  constructor(initialData?: Record<string, CacheItem>) {
    if (initialData) {
      this.#data = initialData;
    }

    Object.keys(this.#data).forEach((key: string) => {
      if (this.#data[key].ttl !== undefined) {
        this.#timeouts[key] = setTimeout(() => {
          this.remove(key);
        }, (this.#data[key].ttl as number) * 1000);
      }
    });
  }

  get(key: string) {
    return this.#data[key]?.value;
  }

  set(key: string, data: CacheItem) {
    if (this.#timeouts[key]) {
      clearTimeout(this.#timeouts[key]);
    }
    this.#data[key] = data;
    if (data.ttl) {
      this.#timeouts[key] = setTimeout(() => this.remove(key), data.ttl * 1000);
    }
  }

  remove(key: string) {
    delete this.#data[key];
    if (this.#timeouts[key]) {
      clearTimeout(this.#timeouts[key]);
    }
    delete this.#timeouts[key];
  }
}

export default DataCache;
