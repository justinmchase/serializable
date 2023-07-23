import { Type, type } from "type/mod.ts";

export type ToJson = { toJSON(): string };
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
  value: Record<string, unknown>,
): SerializableRecord {
  return Object.entries(value)
    .filter(([k, v]) =>
      type(k)[0] === Type.String && type(v)[0] !== Type.Undefined
    )
    .reduce((l, [k, v]) => ({ ...l, [k]: toSerializable(v) }), {});
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
    case Type.Error: {
      const { name, message, stack, cause, ...rest } = v;
      return {
        name,
        message,
        stack,
        ...cause !== undefined ? { cause: toSerializable(cause) } : {},
        ...toSerializableRecord(rest),
      };
    }
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
