# Cache

## Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [API](#api)

## Getting Started

### Installation

Run `npm install @alwian/data-cache` to install the latest version.

### Basic Usage

```ts
import DataCache from "@alwian/data-cache";

// Create a cache using the default config and no initial data
const cache = new DataCache();

// Create a cache with some custom config and initial data
const cacheWithConfig = new DataCache({
  initialData: [{ key: "myKey", value: "myValue" }],
  defaultTtl: 10,
  ...
})
```

See [API](./docs/api.md) for all operations and configuration options that are available.
