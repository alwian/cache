# Cache

## Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)

## Getting Started

### Installation

Run `npm install @alwian/cache` to install the latest version.

### Basic Usage

```ts
import Cache from "@alwian/cache";

// Create a cache using the default config and no initial data
const cache = new Cache();

// Create a cache with some custom config and initial data
const cacheWithConfig = new Cache({
  initialData: [{ key: "myKey", value: "myValue" }],
  defaultTtl: 10,
  ...
})
```

See [API](./docs/api.md) for all operations and configuration options that are available.
