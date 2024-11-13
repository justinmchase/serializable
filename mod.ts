import { Type, type } from "@justinmchase/type";

/**
 * An object type which implements a custom toJSON function
 */
export type ToJson = { toJSON(): Serializable };

/**
 * A record type which contains only serializable values
 */
export type SerializableRecord = { [key: string]: Serializable };

/**
 * A type which can be serialized
 */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | ToJson
  | SerializableRecord
  | Serializable[];

/**
 * Checks if a value is a ToJson object
 * @param value The value to check
 * @returns Whether the value is a ToJson object
 * @example
 * ```ts
 * isToJson({ toJSON: () => "foo" }); // true
 * isToJson({}); // false
 * isToJson("foo"); // false
 * ```
 */
export function isToJson(value: unknown): value is ToJson {
  return typeof (value as ToJson).toJSON === "function";
}

export function isReference(t: Type): boolean {
  switch (t) {
    case Type.Object:
    case Type.Array:
    case Type.Error:
    case Type.Function:
      return true;
    default:
      return false;
  }
}


/**
 * Recursively converts a value into a serializable value.
 * - Null, number, boolean, string, and undefined values are returned as is.
 * - BigInt values are converted to strings.
 * - Array values are recursively converted.
 * - Error and Object values are converted to serializable records.
 * - Objects with a custom toJSON function have their toJSON function called and the result is returned.
 * @param value The value to convert
 * @returns The serializable value
 * @example
 * ```ts
 * toSerializable(null); // null
 * toSerializable(42); // 42
 * toSerializable(true); // true
 * toSerializable("foo"); // "foo"
 * toSerializable(undefined); // undefined
 * toSerializable(BigInt(42)); // "42"
 * toSerializable([1, 2, 3]); // [1, 2, 3]
 * toSerializable(new Error("foo")); // { name: "Error", message: "foo", stack: "Error: foo\n    at <anonymous>:1:1", ... }
 * toSerializable({ foo: "bar" }); // { foo: "bar" }
 * toSerializable({ toJSON: () => "foo" }); // "foo"
 * ```
 * @throws If the value is not serializable
 */
export function toSerializable(
  value: unknown,
): Serializable {
  let i = 0;
  const instances = new Map<unknown, number>();
  const resolve = (value: unknown): Serializable => {
    const [t, v] = type(value);
    if (isReference(t)) {
      if (instances.has(value)) {
        return { _ref: instances.get(value) };
      } else {
        instances.set(value, i++);
      }
    }

    const record = (
      value: Error | Record<string, unknown>,
    ): SerializableRecord =>
      Object.entries(value)
        .filter(([k, v]) =>
          type(k)[0] === Type.String && type(v)[0] !== Type.Undefined
        )
        .reduce((l, [k, v]) => ({ ...l, [k]: resolve(v) }), {});

    switch (t) {
      case Type.Null:
      case Type.Number:
      case Type.Boolean:
      case Type.String:
        return v;
      case Type.BigInt:
        return v.toString();
      case Type.Array:
        return v.map((v) => resolve(v));
      case Type.Error: {
        const { name, message, stack, cause, ...rest } = v;
        return {
          name,
          message,
          stack,
          ...cause !== undefined ? { cause: resolve(cause) } : {},
          ...record(rest),
        };
      }
      case Type.Object:
        if (isToJson(value)) {
          return value;
        } else {
          return record(v);
        }
      default:
        return undefined;
    }
  };
  return resolve(value);
}

/**
 * Converts an error or record into a serializable record.
 * - Keys which are not strings are omitted.
 * - Keys with an undefined value are omitted.
 * - All values are converted to serializable values using the toSerializable function.
 * @param value The value to convert
 * @returns The serializable record
 * @example
 * ```ts
 * toSerializableRecord(new Error("foo")); // { name: "Error", message: "foo", stack: "Error: foo\n    at <anonymous>:1:1", ... }
 * toSerializableRecord({ foo: "bar" }); // { foo: "bar" }
 * ```
 * @throws If the value is not an error or record
 */
export function toSerializableRecord(
  value: Error | Record<keyof unknown, unknown>,
): SerializableRecord {
  const [t, v] = type(value);
  switch (t) {
    case Type.Error:
    case Type.Object:
      return toSerializable(v) as SerializableRecord;
    default:
      throw new TypeError(
        `Unable to convert type ${t} into a Record<string, unknown>`,
      );
  }
}
