# serializable

Serializable type definitions for TypeScript and a helper function to convert
anything into a safely serializable value.

## Usage

```ts
import { toSerializable } from "jsr:@justinmchase/serializable";

export function send(message: unknown) {
  const serializable = toSerializable(message);
  return JSON.stringify(message); // will now throw
}
```
