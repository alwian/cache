import DataCache from ".";

jest.useFakeTimers();

describe("DataCache tests", () => {
  it("Allows the user to fetch data", () => {
    const cache = new DataCache({ testKey: { value: "testValue" } });

    expect(cache.get("testKey")).toEqual("testValue");
  });

  it("Allows the user to add data", () => {
    const cache = new DataCache();
    cache.set("testKey", { value: "testValue" });

    expect(cache.get("testKey")).toEqual("testValue");
  });

  it("Allows the user to remove data", () => {
    const cache = new DataCache({ testKey: { value: "testValue" } });

    cache.remove("testKey");
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Automatically deletes data when a ttl is specified", () => {
    const cache = new DataCache({ testKey: { value: "testValue", ttl: 5 } });

    jest.runAllTimers();
    expect(cache.get("testKey")).toEqual(undefined);
  });

  it("Clears and resets (if a ttl is given) a timeout if data is updated", () => {
    const cache = new DataCache({ testKey: { value: "testValue", ttl: 5 } });
    cache.set("testKey", { value: "newTestValue", ttl: 10 });

    jest.advanceTimersByTime(5000);
    expect(cache.get("testKey")).toEqual("newTestValue");

    jest.runAllTimers();
    expect(cache.get("testKey")).toEqual(undefined);
  });
});
