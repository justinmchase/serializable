import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.197.0/assert/mod.ts";
import { isToJson, toSerializable, toSerializableRecord } from "./mod.ts";

class TestError extends Error {
  constructor(public readonly extra = 100) {
    super("test error 123", { cause: { x: 1, y: 2 } });
    this.name = "TestError";
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
      [[1, [2, [3]]], [1, [2, [3]]]],
      [new TestError(), {
        message: "test error 123",
        name: "TestError",
        cause: { x: 1, y: 2 },
        extra: 100,
      }],
      [{ toJSON: () => "[]" }, { toJSON: () => "[]" }],
      [{ x: 1, y: true, z: "three" }, { x: 1, y: true, z: "three" }],
      [
        new Date("2020-01-01T00:00:00.000Z"),
        new Date("2020-01-01T00:00:00.000Z"),
      ],
    ];

    for (const [value, expected] of data) {
      await t.step({
        name: `${value} -> ${expected}`,
        fn: () => {
          const actual = toSerializable(value);
          delete (actual as unknown as { stack: unknown })?.stack;
          assertEquals(
            JSON.parse(JSON.stringify(actual) ?? "null"),
            JSON.parse(JSON.stringify(expected) ?? "null"),
          );
        },
      });
    }
  },
});

Deno.test({
  name: "to serializable record",
  fn: async (t) => {
    await t.step({
      name: "error",
      fn: () => {
        const error = new Error("test 123", { cause: "example" });
        const { stack: _, ...actual } = toSerializableRecord(error);
        assertEquals(actual, {
          name: "Error",
          message: "test 123",
          cause: "example",
        });
      },
    });
    await t.step({
      name: "record",
      fn: () => {
        const record = { x: 1, y: "two" };
        const actual = toSerializableRecord(record);
        assertEquals(actual, {
          x: 1,
          y: "two",
        });
      },
    });
    await t.step({
      name: "non-record",
      fn: () => {
        assertThrows(
          () => toSerializableRecord(true as unknown as Error),
          "Unable to convert type boolean into a Record<string, unknown>",
        );
      },
    });
  },
});

Deno.test({
  name: "to serializable record with recursion",
  fn: async (t) => {
    await t.step({
      name: "error",
      fn: () => {
        const a = { b: null } as { b: unknown };
        const b = { a };
        a.b = b;

        const { stack: _, ...actual } = toSerializableRecord(a);
        assertEquals(actual, {
          b: {
            a: {
              _ref: 0,
            },
          },
        });
      },
    });
  },
});

Deno.test({
  name: "ToJSON type guard",
  fn: () => {
    const value = { x: 1, y: 2, toJSON: () => ({ z: 3 }) };
    assert(isToJson(value));
    assertEquals(JSON.stringify(value), '{"z":3}');
  },
});
