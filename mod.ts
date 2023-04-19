export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | { toJSON(): string }
  | { [key: string]: Serializable }
  | Serializable[];
