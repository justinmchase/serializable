# serializable

Serializable type definitions for TypeScript

## Usage

```ts
import type { Serializable } from "https://deno.land/x/serializable@0.1.0/mod.ts";

export function send(message: Serializable) {
  const data = JSON.stringify(message);
  // ...
}
```