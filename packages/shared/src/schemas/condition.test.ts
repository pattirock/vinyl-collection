import { describe, expect, it } from "vitest";

import {
  GOLDMINE_GRADES,
  GOLDMINE_GRADE_LABELS,
  compareGoldmineGrades,
  goldmineGradeSchema,
  type GoldmineGrade,
} from "./condition.js";

describe("goldmineGradeSchema", () => {
  it.each(GOLDMINE_GRADES)("accepts %s", (grade) => {
    expect(goldmineGradeSchema.parse(grade)).toBe(grade);
  });

  it.each(["", "nm", "VG-", "Excellent", 5, null])("rejects %j", (value) => {
    expect(goldmineGradeSchema.safeParse(value).success).toBe(false);
  });
});

describe("GOLDMINE_GRADE_LABELS", () => {
  it("has a label for every grade", () => {
    expect(Object.keys(GOLDMINE_GRADE_LABELS).sort()).toEqual([...GOLDMINE_GRADES].sort());
  });
});

describe("compareGoldmineGrades", () => {
  it("sorts grades from best to worst", () => {
    const shuffled: GoldmineGrade[] = ["G", "M", "VG+", "P", "NM"];
    expect(shuffled.sort(compareGoldmineGrades)).toEqual(["M", "NM", "VG+", "G", "P"]);
  });

  it("returns 0 for equal grades", () => {
    expect(compareGoldmineGrades("VG", "VG")).toBe(0);
  });
});
