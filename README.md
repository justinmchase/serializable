# serializable

Serializable type definitions for TypeScript and a helper function to convert
anything into a safely serializable value.

## Usage

```ts
import type { Serializable } from "https://deno.land/x/serializable/mod.ts";
import { toSerializable } from "https://deno.land/x/serializable/mod.ts";

export function send(message: unknown) {
  const serializable: Serializable = toSerializable(message);
  const data = JSON.stringify(message);
  // ...
}
```
