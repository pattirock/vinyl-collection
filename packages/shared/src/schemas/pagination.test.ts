import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  cursorSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from "./pagination.js";

describe("paginationQuerySchema", () => {
  it("applies the default limit when none is given", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ limit: PAGINATION_DEFAULT_LIMIT });
  });

  it("coerces query-string numbers", () => {
    expect(paginationQuerySchema.parse({ limit: "50", cursor: "abc_DEF-123" })).toEqual({
      limit: 50,
      cursor: "abc_DEF-123",
    });
  });

  it.each([
    ["zero", "0"],
    ["negative", "-5"],
    ["above the max", String(PAGINATION_MAX_LIMIT + 1)],
    ["a decimal", "2.5"],
    ["not a number", "abc"],
    ["an empty string", ""],
  ])("rejects a limit that is %s", (_label, limit) => {
    expect(paginationQuerySchema.safeParse({ limit }).success).toBe(false);
  });
});

describe("cursorSchema", () => {
  it.each([
    ["empty", ""],
    ["a NoSQL operator", '{"$gt":""}'],
    ["a path traversal", "../../etc/passwd"],
    ["too long", "a".repeat(257)],
  ])("rejects a cursor that is %s", (_label, cursor) => {
    expect(cursorSchema.safeParse(cursor).success).toBe(false);
  });

  it("rejects non-string cursors such as injected objects", () => {
    expect(cursorSchema.safeParse({ $ne: null }).success).toBe(false);
  });
});

describe("paginatedResponseSchema", () => {
  const schema = paginatedResponseSchema(z.object({ id: z.string() }));

  it("accepts a page with a next cursor or with null at the end", () => {
    expect(schema.safeParse({ items: [{ id: "1" }], nextCursor: "next_1" }).success).toBe(true);
    expect(schema.safeParse({ items: [], nextCursor: null }).success).toBe(true);
  });

  it("validates every item", () => {
    expect(schema.safeParse({ items: [{ id: 1 }], nextCursor: null }).success).toBe(false);
  });
});
