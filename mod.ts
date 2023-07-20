type ToJson = { toJSON(): string }
type SerializableRecord = { [key: string]: Serializable }

export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | ToJson
  | SerializableRecord
  | Serializable[];

function isToJson(value: unknown): value is ToJson {
  return typeof (value as ToJson).toJSON === 'function'
}

// deno-lint-ignore ban-types
function toSerializableRecord(value: object): SerializableRecord {
  return Object.entries(value)
    .reduce((l, [k,v]) => ({...l, [k]: toSerializable(v) }), {})
}

export function toSerializable(value: unknown): Serializable {
  switch (typeof value) {
    case "number":
    case "boolean":
    case "string":
      return value;
    case "bigint":
      return value.toString()
    case "object": {
      if (value === null) return null;
      else if (Array.isArray(value)) return value.map(v => toSerializable(v));
      else if (value instanceof Error) {
        const { name, message, stack, cause, ...rest } = value;
        return {
          name,
          message,
          stack,
          ...cause !== undefined ? { cause: toSerializable(cause) } : {},
          ...toSerializableRecord(rest)
        }
      } else if (isToJson(value)) {
        return value
      } else {
        return toSerializableRecord(value)
      }
    }
    default:
      return undefined
  }
}
