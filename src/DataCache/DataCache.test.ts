import DataCache from ".";

jest.useFakeTimers();

describe("DataCache tests", () => {
  it("Allows the user to add data", () => {
    const cache = new DataCache();
    cache.set({ key: "testKey", value: "testValue" });

    expect(cache.get("testKey")).toEqual("testValue");
  });

  it("Allows the user to remove data", () => {
    const cache = new DataCache({
      initialData: [{ key: "testKey", value: "testValue" }]
    });

    cache.remove("testKey");
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Automatically deletes data when a ttl is specified", () => {
    const cache = new DataCache({
      initialData: [{ key: "testKey", value: "testValue", ttl: 5 }]
    });

    jest.advanceTimersByTime(5000);
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Clears and resets (if a ttl is given) a timeout if data is updated", () => {
    const cache = new DataCache({
      initialData: [{ key: "testKey", value: "testValue", ttl: 5 }]
    });
    cache.set({ key: "testKey", value: "newTestValue", ttl: 10 });

    jest.advanceTimersByTime(5000);
    expect(cache.get("testKey")).toEqual("newTestValue");

    jest.advanceTimersByTime(5000);
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Can insert data", () => {
    const cache = new DataCache();

    cache.set(
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" }
    );

    expect(cache.get("key1")).toEqual("value1");
    expect(cache.get("key2")).toEqual("value2");
  });

  it("Can retrieve data", () => {
    const cache = new DataCache({
      initialData: [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ]
    });

    expect(cache.get("key1")).toEqual("value1");

    const res = cache.get("key1", "key2");
    expect((res as Record<string, string>)["key1"]).toEqual("value1");
    expect((res as Record<string, string>)["key2"]).toEqual("value2");

    const res2 = cache.get();
    expect(res2).toEqual(res);
  });

  it("Can pop data from the cache", () => {
    const cache = new DataCache({
      initialData: [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ]
    });

    expect(cache.pop("key1", "key2")).toEqual({
      key1: "value1",
      key2: "value2"
    });
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();

    cache.set({ key: "key3", value: "value3" });
    expect(cache.pop("key3")).toEqual("value3");
  });

  it("Clear the cache", () => {
    const cache = new DataCache({
      initialData: [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ]
    });
    cache.clear();

    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });

  it("Can check for a key", () => {
    const cache = new DataCache({
      initialData: [{ key: "key", value: "value" }]
    });

    expect(cache.has("key")).toBeTruthy();
    expect(cache.has("key2")).toBeFalsy();
  });

  it("Can return a list of keys", () => {
    const cache = new DataCache({
      initialData: [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ]
    });

    expect(cache.keys()).toEqual(["key1", "key2"]);
  });

  it("Records access counts for each key", () => {
    const cache = new DataCache({
      initialData: [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ]
    });

    cache.get("key1", "key2");
    cache.get("key1");

    expect(cache.stats("key1").accesses).toEqual(2);
    expect(
      (cache.stats("key1", "key2") as Record<string, ItemStats>)["key2"]
        .accesses
    ).toEqual(1);
    expect(cache.stats().accesses).toEqual(3);
  });

  it("Accepts a default ttl", () => {
    const cache = new DataCache({
      initialData: [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ],
      defaultTtl: 5
    });

    jest.advanceTimersByTime(4000);
    expect(cache.get("key1")).toEqual("value1");
    expect(cache.get("key2")).toEqual("value2");
    jest.advanceTimersByTime(1000);
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });

  it("Uses an item specific ttl over a default one", () => {
    const cache = new DataCache({
      initialData: [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2", ttl: 6 }
      ],
      defaultTtl: 5
    });

    jest.advanceTimersByTime(4000);
    expect(cache.get("key1")).toEqual("value1");
    expect(cache.get("key2")).toEqual("value2");
    jest.advanceTimersByTime(1000);
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toEqual("value2");
  });

  it("Can take in a custom interval duration", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1" }],
      defaultTtl: 5,
      interval: 10
    });

    jest.advanceTimersByTime(5000);
    expect(cache.get("key1")).toEqual("value1");
    jest.advanceTimersByTime(5000);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("Can accept an updated defaultTtl", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1" }],
      defaultTtl: 5
    });

    expect(cache.get("key1")).toEqual("value1");
    jest.advanceTimersByTime(5000);
    expect(cache.get("key1")).toBeUndefined();

    cache.config({ defaultTtl: 10 });
    cache.set({ key: "key2", value: "value2" });

    jest.advanceTimersByTime(8000);
    expect(cache.get("key2")).toEqual("value2");
    jest.advanceTimersByTime(2000);
    expect(cache.get("key2")).toBeUndefined();
  });

  it("Can accept an updated interval", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }],
      interval: 5
    });
    expect(cache.get("key1")).toEqual("value1");
    jest.advanceTimersByTime(5000);
    expect(cache.get("key1")).toBeUndefined();

    cache.config({ interval: 10 });
    cache.set({ key: "key2", value: "value2", ttl: 5 });

    jest.advanceTimersByTime(5000);
    expect(cache.get("key2")).toEqual("value2");
    jest.advanceTimersByTime(5000);
    expect(cache.get("key2")).toBeUndefined();
  });

  it("Can update the ttl of an item(s)", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });

    jest.advanceTimersByTime(4000);
    cache.ttl(10, "key1");
    jest.advanceTimersByTime(1000);
    expect(cache.get("key1")).toEqual("value1");
    jest.advanceTimersByTime(5000);
    expect(cache.get("key1")).toBeUndefined();

    cache.set(
      { key: "key1", value: "value1", ttl: 5 },
      { key: "key2", value: "value2", ttl: 5 }
    );
    jest.advanceTimersByTime(4000);
    cache.ttl(10);
    jest.advanceTimersByTime(1000);
    expect(cache.get("key1")).toEqual("value1");
    expect(cache.get("key2")).toEqual("value2");
    jest.advanceTimersByTime(5000);
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });

  it("Emits an event on set", () => {
    const mock = jest.fn();

    const cache = new DataCache();
    cache.on("set", (key, value) => {
      mock(key, value);
    });
    cache.set({ key: "key1", value: "value1", ttl: 5 });
    expect(mock).toHaveBeenCalledWith("key1", "value1");
  });

  it("Emits an event on get", () => {
    const mock = jest.fn();

    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });
    cache.on("get", (key, value) => {
      mock(key, value);
    });
    cache.get("key1");
    expect(mock).toHaveBeenCalledWith("key1", "value1");
  });

  it("Emits an event on remove", () => {
    const mock = jest.fn();

    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });
    cache.on("remove", (key, value) => {
      mock(key, value);
    });
    cache.remove("key1");
    expect(mock).toHaveBeenCalledWith("key1", "value1");
  });

  it("Emits an event on pop", () => {
    const mock = jest.fn();

    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });
    cache.on("pop", (key, value) => {
      mock(key, value);
    });
    cache.pop("key1");
    expect(mock).toHaveBeenCalledWith("key1", "value1");
  });

  it("Emits an event on expire", () => {
    const mock = jest.fn();

    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });
    cache.on("expire", (key, value) => {
      mock(key, value);
    });
    jest.advanceTimersByTime(5000);
    expect(mock).toHaveBeenCalledWith("key1", "value1");
  });

  it("Emits an event on clear", () => {
    const mock = jest.fn();

    const cache = new DataCache();
    cache.on("clear", () => {
      mock();
    });
    cache.clear();

    expect(mock).toHaveBeenCalled();
  });

  it("It can store multiple data types", () => {
    const cache = new DataCache();
    cache.set(
      { key: "key1", value: "value1" },
      { key: "key2", value: 0 },
      { key: "key3", value: { field: 1 } }
    );

    expect(cache.get("key1")).toEqual("value1");
    expect(cache.get("key2")).toEqual(0);
    expect(cache.get("key3")).toEqual({ field: 1 });
  });

  it("Can purge expired items", () => {
    const mock = jest.fn();

    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1" }],
      removeOnExpire: false,
      defaultTtl: 5
    });
    cache.on("expire", (key, value) => {
      mock(key, value);
    });
    jest.advanceTimersByTime(5000);
    expect(mock).toHaveBeenCalledWith("key1", "value1");

    expect(cache.get("key1")).toEqual("value1");

    cache.purge();
    expect(cache.get("key1")).toBeUndefined();
  });

  it("Can reset the expiry time of items", () => {
    const mock = jest.fn();
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }],
      removeOnExpire: false,
      expireOnce: false
    });
    cache.on("expire", (key, value) => {
      mock(key, value);
    });
    jest.advanceTimersByTime(5000);
    expect(mock).toHaveBeenCalledWith("key1", "value1");
    expect(cache.get("key1")).toEqual("value1");

    jest.advanceTimersByTime(1000);
    expect(mock).toHaveBeenNthCalledWith(2, "key1", "value1");
    cache.reset();
    jest.advanceTimersByTime(1000);
    expect(mock).not.toHaveBeenNthCalledWith(3, "key1", "value1");
  });

  it("Can restrict items to a single expire event", () => {
    const mock = jest.fn();
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }],
      removeOnExpire: false,
      expireOnce: true
    });
    cache.on("expire", (key, value) => {
      mock(key, value);
    });
    jest.advanceTimersByTime(5000);
    expect(mock).toHaveBeenCalledWith("key1", "value1");
    expect(cache.get("key1")).toEqual("value1");

    jest.advanceTimersByTime(1000);
    expect(mock).not.toHaveBeenNthCalledWith(2, "key1", "value1");

    cache.config({ ...cache.config, expireOnce: false });
    jest.advanceTimersByTime(1000);
    expect(mock).toHaveBeenNthCalledWith(2, "key1", "value1");
  });

  it("Can return an array of values", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });

    expect(cache.values()).toEqual(["value1"]);
  });

  it("Can return an array of entries", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });

    expect(cache.entries()).toEqual([["key1", "value1"]]);
  });

  it("Can limit capacity", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }],
      capacity: 1
    });

    cache.set({ key: "key2", value: "value2" });
    expect(cache.get("key2")).toBeUndefined();

    cache.config({ errorOnFull: true });
    expect(() => cache.set({ key: "key2", value: "value2" })).toThrowError(
      "Could not add items as capacity would be exceeded"
    );
  });

  it("Throws a error when an item is undefined and errorOnMiss is true", () => {
    const cache = new DataCache({ errorOnMiss: true });

    expect(() => cache.get("key1")).toThrowError("Key key1 is undefined.");
  });

  it("Allows the stats of items to be cleared", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }]
    });

    cache.get("key1");
    expect(cache.stats("key1").accesses).toEqual(1);
    cache.clearStats();
    expect(cache.stats("key1").accesses).toEqual(0);
  });

  it("Can throw an error when duplicate keys are added", () => {
    const cache = new DataCache({
      initialData: [{ key: "key1", value: "value1", ttl: 5 }],
      errorOnDuplicate: true
    });

    expect(() => cache.set({ key: "key1", value: "value2" })).toThrowError(
      "Cannot add existing key key1"
    );
  });
});
