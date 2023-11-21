import { Type, type } from "https://deno.land/x/type@0.2.0/mod.ts";

export type ToJson = { toJSON(): Serializable };
export type SerializableRecord = { [key: string]: Serializable };

export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | ToJson
  | SerializableRecord
  | Serializable[];

export function isToJson(value: unknown): value is ToJson {
  return typeof (value as ToJson).toJSON === "function";
}

export function toSerializableRecord(
  value: Error | Record<string, unknown>,
): SerializableRecord {
  const [t, v] = type(value);
  if (t === Type.Error) {
    const { name, message, stack, cause, ...rest } = v;
    return {
      name,
      message,
      stack,
      ...cause !== undefined ? { cause: toSerializable(cause) } : {},
      ...toSerializableRecord(rest),
    };
  } else if (t === Type.Object) {
    return Object.entries(value)
      .filter(([k, v]) =>
        type(k)[0] === Type.String && type(v)[0] !== Type.Undefined
      )
      .reduce((l, [k, v]) => ({ ...l, [k]: toSerializable(v) }), {});
  } else {
    throw new TypeError(
      `Unable to convert type ${t} into a Record<string, unknown>`,
    );
  }
}

export function toSerializable(value: unknown): Serializable {
  const [t, v] = type(value);
  switch (t) {
    case Type.Null:
    case Type.Number:
    case Type.Boolean:
    case Type.String:
      return v;
    case Type.BigInt:
      return v.toString();
    case Type.Array:
      return v.map((v) => toSerializable(v));
    case Type.Error:
    case Type.Object:
      if (isToJson(value)) {
        return value;
      } else {
        return toSerializableRecord(v);
      }
    default:
      return undefined;
  }
}
