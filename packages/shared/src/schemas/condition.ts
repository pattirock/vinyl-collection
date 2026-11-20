import { z } from "zod";

/**
 * Goldmine grading scale used for both media (disc) and sleeve condition,
 * ordered from best to worst.
 */
export const GOLDMINE_GRADES = ["M", "NM", "VG+", "VG", "G+", "G", "F", "P"] as const;

export const goldmineGradeSchema = z.enum(GOLDMINE_GRADES);

export type GoldmineGrade = z.infer<typeof goldmineGradeSchema>;

export const GOLDMINE_GRADE_LABELS: Readonly<Record<GoldmineGrade, string>> = {
  M: "Mint",
  NM: "Near Mint",
  "VG+": "Very Good Plus",
  VG: "Very Good",
  "G+": "Good Plus",
  G: "Good",
  F: "Fair",
  P: "Poor",
};

/** Negative when `a` is a better grade than `b`; use with `Array.prototype.sort`. */
export function compareGoldmineGrades(a: GoldmineGrade, b: GoldmineGrade): number {
  return GOLDMINE_GRADES.indexOf(a) - GOLDMINE_GRADES.indexOf(b);
}
