import { describe, expect, it } from "vitest";
import { kcalDepuisKj } from "@/core";

describe("kcalDepuisKj", () => {
  it("convertit des kJ en kcal (÷ 4,184)", () => {
    expect(kcalDepuisKj(4184)).toBe(1000);
    // Nutella : 2 252 kJ pour 100 g, soit environ 538 kcal.
    expect(kcalDepuisKj(2252)).toBeCloseTo(538.24, 2);
    expect(kcalDepuisKj(0)).toBe(0);
  });
});
