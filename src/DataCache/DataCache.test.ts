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
});
