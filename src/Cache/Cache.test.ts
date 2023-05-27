import { describe } from "node:test";
import Cache from ".";

jest.useFakeTimers();

describe("Cache tests", () => {
  describe("get tests", () => {
    it("Can retrieve a single item from the cache", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });
      expect(cache.get("key1")).toEqual("value1");
    });

    it("Can retrieve a multiple items from the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.get("key1", "key2")).toEqual({
        key1: "value1",
        key2: "value2"
      });
    });

    it("Can retrieve all items from the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.get()).toEqual({
        key1: "value1",
        key2: "value2"
      });
    });

    it("Throws an error when errorOnMiss is true", () => {
      const cache = new Cache({
        errorOnMiss: true
      });

      expect(() => cache.get("key1", "key2")).toThrowError(
        "The following keys do not exist on the cache - key1,key2"
      );
    });

    it("Doesn't throw an error when errorOnMiss is true", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });

      expect(cache.get("key1", "key2")).toEqual({ key1: "value1" });
    });

    it("Emits a get event when items are retrieved", () => {
      const mockFn = jest.fn();

      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      cache.on("get", (key: string, value: string) => {
        mockFn(key, value);
      });

      cache.get("key1", "key2");

      expect(mockFn).toHaveBeenNthCalledWith(1, "key1", "value1");
      expect(mockFn).toHaveBeenNthCalledWith(2, "key2", "value2");
    });
  });

  describe("set tests", () => {
    it("Can add items to the cache", () => {
      const cache = new Cache();
      cache.set({ key: "key1", value: "value1" });
      expect(cache.get("key1")).toEqual("value1");
    });

    it("Throws an error when errorOnDuplicate is true", () => {
      const cache = new Cache({ errorOnDuplicate: true });
      cache.set({ key: "key1", value: "value1" });
      expect(() =>
        cache.set(
          { key: "key1", value: "value2" },
          { key: "key3", value: "value3" }
        )
      ).toThrowError("The following keys already exist in the cache - key1");
      expect(cache.get("key3")).toBeUndefined();
    });

    it("Overwites items when errorOnDuplicate is false", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });
      cache.set(
        { key: "key1", value: "value2" },
        { key: "key2", value: "value3" }
      );
      expect(cache.get("key1", "key2")).toEqual({
        key1: "value2",
        key2: "value3"
      });
    });

    it("Throws an error when errorOnFull is true", () => {
      const cache = new Cache({ errorOnFull: true, capacity: 0 });
      expect(() => cache.set({ key: "key1", value: "value1" })).toThrowError(
        "Could not add items as capacity would be exceeded"
      );
    });

    it("Allows items to be added up to capacity when errorOnFull is false", () => {
      const cache = new Cache({ capacity: 1 });
      cache.set(
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      );

      expect(cache.get("key1")).toEqual("value1");
      expect(cache.get("key2")).toBeUndefined();
    });

    it("Emits a set event for each item added", () => {
      const mockFn = jest.fn();

      const cache = new Cache();
      cache.on("set", (key: string, value: string) => {
        mockFn(key, value);
      });

      cache.set(
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      );

      expect(mockFn).toHaveBeenNthCalledWith(1, "key1", "value1");
      expect(mockFn).toHaveBeenNthCalledWith(2, "key2", "value2");
    });
  });

  describe("remove tests", () => {
    it("Can remove items from the cache", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });
      expect(cache.get("key1")).toEqual("value1");
      cache.remove("key1");
      expect(cache.get("key1")).toBeUndefined();
    });

    it("Can remove all items from the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.get("key1")).toEqual("value1");
      expect(cache.get("key2")).toEqual("value2");
      cache.remove();
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
    });

    it("Throws an error when errorOnMiss is true", () => {
      const cache = new Cache({ errorOnMiss: true });
      expect(() => cache.remove("key1")).toThrow(
        "The following keys do not exist on the cache - key1"
      );
    });

    it("Doesn't throw an error when errorOnMiss is false", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });

      cache.remove("key1", "key2");
      expect(cache.get("key1")).toBeUndefined();
    });

    it("Emits a remove event for each item removed", () => {
      const mockFn = jest.fn();

      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      cache.on("remove", (key: string, value: string) => {
        mockFn(key, value);
      });

      cache.remove();

      expect(mockFn).toHaveBeenNthCalledWith(1, "key1", "value1");
      expect(mockFn).toHaveBeenNthCalledWith(2, "key2", "value2");
    });
  });

  describe("pop tests", () => {
    it("Can pop items from the cache", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });
      expect(cache.pop("key1")).toEqual("value1");
      expect(cache.pop("key1")).toEqual(undefined);
    });

    it("Can pop multiple items from the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.pop("key1", "key2")).toEqual({
        key1: "value1",
        key2: "value2"
      });
      expect(cache.pop("key1", "key2")).toEqual({
        key1: undefined,
        key2: undefined
      });
    });

    it("Can pop all items from the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.pop()).toEqual({ key1: "value1", key2: "value2" });
      expect(cache.pop()).toEqual({ key1: undefined, key2: undefined });
    });

    it("Throws an error when errorOnMiss is true", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ],
        errorOnMiss: true
      });
      expect(() => cache.pop("key1", "key3")).toThrowError(
        "The following keys do not exist on the cache - key3"
      );
    });

    it("Doesn't throw an error when errorOnMiss is false", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });
      expect(cache.pop("key1", "key2")).toEqual({ key1: "value1" });
    });

    it("Emits a pop event for each item removed", () => {
      const mockFn = jest.fn();

      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      cache.on("pop", (key: string, value: string) => {
        mockFn(key, value);
      });

      cache.pop();

      expect(mockFn).toHaveBeenNthCalledWith(1, "key1", "value1");
      expect(mockFn).toHaveBeenNthCalledWith(2, "key2", "value2");
    });
  });

  describe("clear tests", () => {
    it("Can clear the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });

      expect(cache.get()).toEqual({ key1: "value1", key2: "value2" });
      cache.clear();
      expect(cache.get()).toEqual({});
    });

    it("Emits a clear even when called", () => {
      const mockFn = jest.fn();

      const cache = new Cache();
      cache.on("clear", () => {
        mockFn();
      });
      cache.clear();
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe("has tests", () => {
    it("Can check if a key exists", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });

      expect(cache.has("key1")).toEqual(true);
      expect(cache.has("key2")).toEqual(false);
    });
  });

  describe("keys tests", () => {
    it("Can return a list of keys that exist", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });

      expect(cache.keys()).toEqual(["key1", "key2"]);
    });
  });

  describe("stats tests", () => {
    it("Can return stats for a single item", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });

      expect(cache.stats("key1")).toEqual({ accesses: 0 });
      expect(cache.stats("key2")).toEqual(undefined);
    });

    it("Can return stats for multiple items", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });

      expect(cache.stats("key1", "key2")).toEqual({
        key1: { accesses: 0 },
        key2: { accesses: 0 }
      });
    });

    it("Can return stats for all items", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });

      expect(cache.stats()).toEqual({
        key1: { accesses: 0 },
        key2: { accesses: 0 }
      });
    });

    it("Throws an error when errorOnMiss is true", () => {
      const cache = new Cache({ errorOnMiss: true });

      expect(() => cache.stats("key1")).toThrowError(
        "The following keys do not exist on the cache - key1"
      );
    });

    it("Doesn't throw an error when errorOnMiss is false", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });

      expect(cache.stats("key1", "key2")).toEqual({
        key1: { accesses: 0 }
      });
    });
  });

  describe("clearStats tests", () => {
    it("Can reset the stats of items", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });

      expect(cache.stats("key1")).toEqual({ accesses: 0 });
      cache.get("key1");
      expect(cache.stats("key1")).toEqual({ accesses: 1 });
      cache.clearStats();
      expect(cache.stats("key1")).toEqual({ accesses: 0 });
    });

    it("Throws an error when errorOnMiss is true", () => {
      const cache = new Cache({ errorOnMiss: true });

      expect(() => cache.clearStats("key1")).toThrowError(
        "The following keys do not exist on the cache - key1"
      );
    });

    it("Does not throw an error when errorOnMiss is false", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1" }]
      });

      cache.get("key1");
      expect(cache.stats("key1")).toEqual({ accesses: 1 });

      cache.clearStats("key1", "key2");
      expect(cache.stats("key1")).toEqual({ accesses: 0 });
    });
  });

  describe("config tests", () => {
    it("Can accept an updated config", () => {
      const cache = new Cache();
      cache.get("key1"); // Shouldn't error as errorOnMiss is false
      cache.config({ errorOnMiss: true });
      expect(() => cache.get("key1")).toThrowError(
        "The following keys do not exist on the cache - key1"
      );
    });
  });

  describe("ttl tests", () => {
    it("Can update the ttl of items", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });

      jest.advanceTimersByTime(4000);
      cache.ttl(10, "key1"); // Should no longer expire at 5 seconds
      jest.advanceTimersByTime(2000);

      expect(cache.get("key1")).toEqual("value1");
    });

    it("Can update the ttl of all items", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });

      jest.advanceTimersByTime(4000);
      cache.ttl(10); // Should no longer expire at 5 seconds
      jest.advanceTimersByTime(2000);

      expect(cache.get("key1")).toEqual("value1");
    });

    it("Throws an error when errorOnMiss is true", () => {
      const cache = new Cache({ errorOnMiss: true });

      expect(() => cache.ttl(5, "key1")).toThrowError(
        "The following keys do not exist on the cache - key1"
      );
    });

    it("Does not throw an error when errorOnMiss is false", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });

      jest.advanceTimersByTime(4000);
      cache.ttl(10, "key1", "key2"); // Should no longer expire at 5 seconds
      jest.advanceTimersByTime(2000);

      expect(cache.get("key1")).toEqual("value1");
    });
  });

  describe("purge tests", () => {
    it("Can remove expired items", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1", ttl: 5 },
          { key: "key2", value: "value2" }
        ],
        removeOnExpire: false,
        defaultTtl: 3
      });
      jest.advanceTimersByTime(4000);
      expect(cache.get("key1")).toEqual("value1");
      jest.advanceTimersByTime(1000);
      expect(cache.get("key1")).toEqual("value1");
      cache.purge();
      expect(cache.get("key1")).toBeUndefined();
    });
  });

  describe("resetExpiry tests", () => {
    it("Can reset the expiry of items", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });
      jest.advanceTimersByTime(4000);
      expect(cache.get("key1")).toEqual("value1");
      cache.resetExpiry("key1");
      jest.advanceTimersByTime(2000);
      expect(cache.get("key1")).toEqual("value1");
      jest.advanceTimersByTime(3000);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("Can reset the expiry of all items", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });
      jest.advanceTimersByTime(4000);
      expect(cache.get("key1")).toEqual("value1");
      cache.resetExpiry();
      jest.advanceTimersByTime(2000);
      expect(cache.get("key1")).toEqual("value1");
      jest.advanceTimersByTime(3000);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("Throws an error when errorOnMiss is true", () => {
      const cache = new Cache({ errorOnMiss: true });

      expect(() => cache.resetExpiry("key1")).toThrowError(
        "The following keys do not exist on the cache - key1"
      );
    });

    it("Doesn't throw an error when errorOnMiss is false", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });
      jest.advanceTimersByTime(4000);
      expect(cache.get("key1")).toEqual("value1");
      cache.resetExpiry("key1", "key2");
      jest.advanceTimersByTime(2000);
      expect(cache.get("key1")).toEqual("value1");
      jest.advanceTimersByTime(3000);
      expect(cache.get("key1")).toBeUndefined();
    });
  });

  describe("values tests", () => {
    it("Can return the values in the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.values()).toEqual(["value1", "value2"]);
    });
  });

  describe("entries tests", () => {
    it("Can return the entries in the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.entries()).toEqual([
        ["key1", "value1"],
        ["key2", "value2"]
      ]);
    });
  });

  describe("size tests", () => {
    it("Can retrun the size of the cache", () => {
      const cache = new Cache({
        initialData: [
          { key: "key1", value: "value1" },
          { key: "key2", value: "value2" }
        ]
      });
      expect(cache.size()).toEqual(2);
    });
  });

  describe("expiry loop tests", () => {
    it("Removes expired items", () => {
      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });
      expect(cache.get("key1")).toEqual("value1");
      jest.advanceTimersByTime(5000);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("Triggers an expire event when an item expires", () => {
      const mockFn = jest.fn();

      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }]
      });
      cache.on("expire", (key: string, value: string) => {
        mockFn(key, value);
      });
      jest.advanceTimersByTime(5000);
      expect(mockFn).toHaveBeenCalledWith("key1", "value1");
    });

    it("Only triggers a single expire event per item when expireOnce is true", () => {
      const mockFn = jest.fn();

      const cache = new Cache({
        initialData: [{ key: "key1", value: "value1", ttl: 5 }],
        expireOnce: true,
        removeOnExpire: false
      });
      cache.on("expire", (key: string, value: string) => {
        mockFn(key, value);
      });
      jest.advanceTimersByTime(5000);
      expect(mockFn).toHaveBeenCalledWith("key1", "value1");
      jest.advanceTimersByTime(5000);
      expect(mockFn).toBeCalledTimes(1);
    });
  });
});
