import { describe, expect, it } from "vitest";

describe("@vinyl/shared package entry point", () => {
  it("is importable by package name (as apps/web and apps/api will)", async () => {
    // Resolved through node_modules + package.json "exports" → built dist/, not a relative path.
    const shared = await import("@vinyl/shared");

    expect(shared.goldmineGradeSchema.parse("NM")).toBe("NM");
    expect(shared.paginationQuerySchema.parse({})).toEqual({ limit: 20 });
  });
});
