# Cache

Cache is a [type safe](#type-safety) way to store data with ttls. Event listneners are also available for different operations, see [Events](#events).

## Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
- [API](#api)

## Getting Started

### Installation

Run `npm install @alwian/cache` to install the latest version.

### Basic Usage

```ts
import Cache from "@alwian/cache";

// Create a cache using the default config and no initial data, you must call .init() before you can use a cache.
const cache = new Cache().init();

// Create a cache with some custom config and initial data
const cacheWithConfig = new Cache().init({
  initialData: [{ key: "myKey", value: "myValue" }],
  defaultTtl: 10,
  ...
})
```

---

## API

- [Types](#types)
  - [Type Safety](#type-safety)
  - [`CacheConfig`](#cacheconfig)
  - [`CacheItem`](#cacheitem)
  - [`ItemStats`](#itemstats)
- [Methods](#methods)
  - [`set(...items: CacheItem[]): void`](#setitems-cacheitem-void)
  - [`get(...keys: string[]): unknown | Record<string,unknown>`](#getkeys-string-unknown--recordstringunknown)
  - [`pop(...keys: string[]): unknown | Record<string, unknown>`](#popkeys-string-unknown--recordstring-unknown)
  - [`remove(...keys: string[]): void`](#removekeys-string-void)
  - [`clear(): void`](#clear-void)
  - [`has(key: string): boolean`](#haskey-string-boolean)
  - [`keys(): string[]`](#keys-string)
  - [`stats(...keys: string[]): CacheStats | ItemStats | Record<string, ItemStats>`](#statskeys-string-itemstats--recordstring-itemstats)
  - [`clearStats(...keys: string[]): void`](#clearstatskeys-string-void)
  - [`config(config: Partial<Omit<CacheConfig, "initialData">>): void`](#configconfig-partialomitcacheconfig-initialdata-void)
  - [`ttl(ttl: number, ...keys: string[]): void`](#ttlttl-number-keys-string-void)
  - [`purge(): void`](#purge-void)
  - [`resetExpiry(...keys: string[]): void`](#resetexpirykeys-string-void)
  - [`values(): unknown[]`](#values-unknown)
  - [`entries(): [string, unknown][]`](#entries-string-unknown)
  - [`size(): number`](#size-number)
- [Events](#events)
  - [`set`](#set)
  - [`get`](#get)
  - [`pop`](#pop)
  - [`remove`](#remove)
  - [`clear`](#clear)

---

### Types

### Type Safety

This package has been built with type safety in mind. It allows you to define what keys are allowed to be stored in a cache, and what type of value each key corresponds too. For example -

```ts
type ItemMap = {
  key1: string;
  key2: number;
  key3: string;
};

// Create cache using predefined key value pairs in ItemMap
const cache = new Cache<ItemMap>().init();

// Won't compile as key4 is not a permitted key
cache.set({ key: "key4", value: "value4" });

// Won't compile as key1 should correspond to a string
cache.set({ key: "key1", value: 10 });

// Will compile as key2 is a valid key and the type of value is correct
cache.set({ key: "key2", value: 10 });
```

Each method available has been written to be type safe -

- When you use a method which requires you to enter keys, it will restrict the available keys to those provided.
- When you need to enter key/value pairs, it will ensure the type of value is correct based on the key provided.

To omit type safety and allow any keys/values, just create the cache without providing ItemMap.

#### `CacheConfig`

This type represents the config used by the cache.

| Field              | Type      | Default Value | Description                                                                                                                                                                          |
| ------------------ | --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `interval`         | `number`  | `1`           | How frequently to check if items have expired (in seconds). Set to 0 to stop checking.                                                                                               |
| `defaultTtl`       | `number`  | `0`           | The default number a seconds before an item should expire once it is added to the cache, 0 mean don't expire.                                                                        |
| `removeOnExpire`   | `boolean` | `true`        | Whether expired items should be removed from the cache.                                                                                                                              |
| `expireOnce`       | `boolean` | `true`        | Whether an expired item should only trigger a single `expire` event, even if it is not removed from the cache and is still expired the next time the cache checks for expired items. |
| `capacity`         | `number`  | `Infinity`    | The maximum number of items that can be in the cache.                                                                                                                                |
| `errorOnFull`      | `boolean` | `false`       | Whether to throw an error when attemtpting to add items which would result in `capacity` being exceeded.                                                                             |
| `errorOnMiss`      | `boolean` | `false`       | Whether to throw and error when attempting to retrieve a non existent item.                                                                                                          |
| `errorOnDuplicate` | `boolean` | `false`       | Whether to throw an error when adding an item with a key that is already in use.                                                                                                     |

#### `CacheItem`

This type represents an item to add to the cache.

| Field   | Type     | Description                                                                         |
| ------- | -------- | ----------------------------------------------------------------------------------- |
| `key`   | `string` | The key used to access the item.                                                    |
| `value` | `any`    | The value of the item.                                                              |
| `ttl?`  | `number` | How long before the item should expire after it is added to the cache (in seconds). |

#### `ItemStats`

This type represents the stats that are stored about an item.

| Field      | Type     | Description                                |
| ---------- | -------- | ------------------------------------------ |
| `accesses` | `number` | How many times the item has been accessed. |

### Methods

#### `set(...items: CacheItem[]): void`

Use this to add items to the cache. If the key being used already exists, by default the existing item will be replaced.

```ts
const cache = new DataCache().init();

cache.set({ key: "key1", value: "key2" }, { key: "key2", value: "value2" });
```

Has the potential to throw an error if -

- [`capacity`](#types) is set, [`errorOnFull`](#types) is `true` and the number of items being added would exceed capacity. In this case no items will be added before the error is thrown.
- [`errorOnDuplicate`](#types) is `true` and an item is being added with a key that already exists in the cache.

#### `get(...keys: string[]): unknown | Record<string,unknown>`

Use this to retrieve items from the cache.

There are 3 potential ways this method can return -

- If no keys are provided then all items will be returned in an object containing each `key`/`value` pair.
- If a single key is provided then the corresponding value will be returned on it's own.
- If multiple keys are provided an object containing each `key`/`value` pair will be returned.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "key2" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.get("key1"); // "key2"
cache.get("key1", "key2"); // { key1: "value1", key2: "value2" }
cache.get(); // { key1: "value1", key2: "value2", key3: "value3" }
cache.get("key4"); // undefined
```

Has the potential to throw an error if -

- [`errorOnMiss`](#types) is `true` and a key is requested that doesn't exist.

#### `pop(...keys: string[]): unknown | Record<string, unknown>`

Use this to retrieve items whilst simultaneousely removing them from the cache.

There are 3 potential ways this method can return -

- If no keys are provided then all items will be returned in an object containing each `key`/`value` pair.
- If a single key is provided then the corresponding value will be returned on it's own.
- If multiple keys are provided an object containing each `key`/`value` pair will be returned.

```ts
const cache = new DataCache({
  initialData: [
    { key: "key1", value: "key2" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.pop("key1"); // "key2"
cache.pop("key1", "key2"); // { key1: "value1", key2: "value2" }
cache.pop(); // { key1: "value1", key2: "value2", key3: "value3" }

cache.get("key1"); // undefined (key was removed with the initial pop call)
```

Has the potential to throw an error if -

- [`errorOnMiss`](#types) is `true` and a key is requested that doesn't exist. In this case no items will have been removed.

#### `remove(...keys: string[]): void`

Remove items from the cache.

There are 2 possible uses for this method -

- Passing 1 or more keys will remove those items from the cache.
- When no keys are specified then all items are removed. This gives the same affect as calling [`clear()`](#clear-void).

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "key2" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.remove("key1", "key2");
cache.get("key1", "key2"); // { key1: undefined, key2: undefined }

cache.remove();
cache.get(); // { key1: undefined, key2: undefined, key3: undefined }
```

Has the potential to throw an error if -

- [`errorOnMiss`](#types) is `true` and a key is passed that doesn't exist. In this case no items will have been removed.

#### `clear(): void`

Remove all items from the cache.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.clear();

cache.get(); // {}
```

#### `has(key: string): boolean`

Check whether a key exists in the cache.

```ts
const cache = new DataCache().init({
  initialData: [{ key: "key1", value: "value1" }]
});

cache.has("key1"); // true
cache.has("key2"); // false
```

#### `keys(): string[]`

Get each key stored in the cache.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.keys(); // ["key1", "key2", "key3"]
```

#### `stats(...keys: string[]): ItemStats | Record<string, ItemStats>`

Get the stats of items in the cache.

There are 3 possible uses for this method -

- Passing a single key will return an `ItemStats` object containing the stats for that key.
- Passing multiple keys will return an object containing `key`/`ItemStats` pairs.
- Passing in no keys will result in the stats for all items being returned in an object of containing `key`/`ItemStats` pairs.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.stats("key1"); // { accesses: 0 }
cache.stats("key1", "key2"); // { key1: { accesses: 0 }, keys2: { accesses: 0 }}
cache.stats(); // { key1: { accesses: 0 }, keys2: { accesses: 0 }, key3: { accesses: 0 }}
```

Has the potential to throw an error if -

- [`errorOnMiss`](#types) is `true` and a key is passed that doesn't exist.

#### `clearStats(...keys: string[]): void`

Reset the stats of items in the cache.

There are 2 possible uses for this method -

- Passing 1 or more keys will reset the stats for the specified keys.
- If no keys are passed then the stats for all items will be reset.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" }
  ]
});

cache.get("key1");
cache.stats("key1"); // { accesses: 1 }

cache.clearStats("key1");
cache.stats("key1"); // { accesses: 0 }

cache.get("key1", "key2");
cache.stats(); // { key1: { accesses: 1 }, key2: { accesses: 1 } }

cache.clearStats();
cache.stats(); // { key1: { accesses: 0 }, key2: { accesses: 0 } }
```

Has the potential to throw an error if -

- [`errorOnMiss`](#types) is `true` and a key is passed that doesn't exist. In this case no items will have been modified.

#### `config(config: Partial<Omit<CacheConfig, "initialData">>): void`

Update the config being used by the cache.

```ts
const cache = new DataCache().init();

cache.config({
  errorOnMiss: true,
  errorOnDuplicate: true
});
```

#### `ttl(ttl: number, ...keys: string[]): void`

Update the `ttl` of items in the cache.

There are 2 ways to use this method -

- Passing in 1 or more keys will update the `ttl` for the specified keys.
- If no keys are specified then all items will have their `ttl` updated.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" }
  ]
});

cache.ttl(10, "key1"); // key1 will now expire 10 seconds after it was added.
cache.ttl(15); // key1 and key2 will now expire 15 seconds after they were added.
```

Has the potential to throw an error if -

- [`errorOnMiss`](#types) is `true` and a key is passed that doesn't exist. In this case no items will have been modified.

#### `purge(): void`

Remove expired items from the cache.

```ts
const cache = new DataCache().init({
  config: {
    defaultTtl: 10, // Items expire after 10 seconds by default
    removeOnExpire: false
  },
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3", ttl: 15 } // Item will expire after 15 seconds
  ]
});

// 10 seconds later
cache.purge();
cache.get(); // "value3"
```

#### `resetExpiry(...keys: string[]): void`

Reset the expiry counter for items in the cache.

This method resets the time at which an item was added to the cache, restarting the countdown to it's expiry. If an item has already expired, it's will no longer be expired.

There are 2 ways to use this method -

- Passing in 1 or more keys will reset the expiry for the specified keys.
- If no keys are passed in then all items are reset.

```ts
const cache = new DataCache().init({
  config: {
    defaultTtl: 10, // Items expire after 10 seconds by default
    removeOnExpire: false
  },
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3", ttl: 15 } // Item will expire after 15 seconds
  ]
});

// 10 Seconds later key1 and key2 are expired

cache.resetExpiry("key1"); // key1 no longer expired and will expire in 10 seconds
cache.resetExpiry(); // All keys have been reset and will expire in the relevant number of seconds
```

Has the potential to throw an error if -

- [`errorOnMiss`](#types) is `true` and a key is passed that doesn't exist. In this case no items will have been modified.

#### `values(): unknown[]`

Get each value stored in the cache.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.values(); // ["value1", "value2", "value3"]
```

#### `entries(): [string, unknown][]`

Get each `key`/`value` pair stored in the cache.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.entries(); // [["key1", "value1"], ["key2", "value2"], ["key3", "value3"]]
```

#### `size(): number`

Get the number of items stored in the cache.

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
    { key: "key3", value: "value3" }
  ]
});

cache.size(); // 3
```

### Events

#### `set`

This event is triggered for each item that is added to the cache using [`set`](#setitems-cacheitem-void).

```ts
const cache = new DataCache().init();

cache.on("set", (key: string, value: unknown) => {
  console.log(`${key} + ${value as string}`);
});

cache.set({ key: "key1", value: "value1" }, { key: "key2", value: "value2" });

// console.log: key1 + value1
// console.log: key2 + value2
```

#### `get`

This is event is triggered for each item that is retrieved using [`get`](#getkeys-string-unknown--recordstringunknown).

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" }
  ]
});

cache.on("get", (key: string, value: unknown) => {
  console.log(`${key} + ${value as string}`);
});

cache.get();

// console.log: key1 + value1
// console.log: key2 + value2
```

#### `pop`

This is event is triggered for each item that is retrieved using [`pop`](#popkeys-string-unknown--recordstring-unknown).

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" }
  ]
});

cache.on("pop", (key: string, value: unknown) => {
  console.log(`${key} + ${value as string}`);
});

cache.pop();

// console.log: key1 + value1
// console.log: key2 + value2
```

#### `remove`

This event is triggered for each item that is removed using [`remove`](#removekeys-string-void).

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" }
  ]
});

cache.on("remove", (key: string, value: unknown) => {
  console.log(`${key} + ${value as string}`);
});

cache.remove();

// console.log: key1 + value1
// console.log: key2 + value2
```

#### `clear`

This is event is triggered when the cache is cleared using [`clear`](#clear-void).

```ts
const cache = new DataCache().init({
  initialData: [
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" }
  ]
});

cache.on("pop", () => {
  console.log("Cache cleared");
});

cache.clear();

// console.log: Cache cleared
```
