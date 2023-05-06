import DataCache from ".";

jest.useFakeTimers();

describe("DataCache tests", () => {
  it("Allows the user to fetch data", () => {
    const cache = new DataCache([{ key: "testKey", value: "testValue" }]);

    expect(cache.get("testKey")).toEqual("testValue");
  });

  it("Allows the user to add data", () => {
    const cache = new DataCache();
    cache.set({ key: "testKey", value: "testValue" });

    expect(cache.get("testKey")).toEqual("testValue");
  });

  it("Allows the user to remove data", () => {
    const cache = new DataCache([{ key: "testKey", value: "testValue" }]);

    cache.remove("testKey");
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Automatically deletes data when a ttl is specified", () => {
    const cache = new DataCache([
      { key: "testKey", value: "testValue", ttl: 5 }
    ]);

    jest.advanceTimersByTime(5000);
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Clears and resets (if a ttl is given) a timeout if data is updated", () => {
    const cache = new DataCache([
      { key: "testKey", value: "testValue", ttl: 5 }
    ]);
    cache.set({ key: "testKey", value: "newTestValue", ttl: 10 });

    jest.advanceTimersByTime(5000);
    expect(cache.get("testKey")).toEqual("newTestValue");

    jest.advanceTimersByTime(5000);
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Can set multiple keys", () => {
    const cache = new DataCache();

    cache.setMultiple([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" }
    ]);

    expect(cache.get("key1")).toEqual("value1");
    expect(cache.get("key2")).toEqual("value2");
  });

  it("Can get multiple keys", () => {
    const cache = new DataCache([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" }
    ]);

    const res = cache.getMultiple(["key1", "key2"]);

    expect(res["key1"]).toEqual("value1");
    expect(res["key2"]).toEqual("value2");
  });
});
