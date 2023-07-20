import { assertEquals} from "std/testing/asserts.ts"
import { toSerializable } from "./mod.ts"

class TestError extends Error {
  constructor(public readonly extra = 100) {
    super("test error 123", { cause: { x: 1, y: 2 }})
    this.name = "TestError"
  }
}

Deno.test({
  name: "toSerializable",
  fn: async (t) => {
    const data: [unknown, unknown][] = [
      [null, null],
      [undefined, null],
      [true, true],
      [false, false],
      [0, 0],
      [BigInt(100), "100"],
      [[], []],
      [new TestError(), {
        message: "test error 123",
        name: "TestError",
        cause: { x: 1, y: 2 },
        extra: 100
      }],
      [{ toJSON: () => "[]"}, { toJSON: () => "[]"}],
      [{ x: 1, y: true, z: "three" }, { x: 1, y: true, z: "three" }],
      [new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-01T00:00:00.000Z')],
    ]

    for (const [value, expected] of data) {
      await t.step({
        name: `${value} -> ${expected}`,
        fn: () => {
          const actual = toSerializable(value)
          delete (actual as unknown as { stack: unknown })?.stack
          assertEquals(
            JSON.parse(JSON.stringify(actual) ?? "null"),
            JSON.parse(JSON.stringify(expected) ?? "null"),
          )
        }
      })
    }
  }
})
