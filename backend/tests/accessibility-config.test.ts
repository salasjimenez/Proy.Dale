import { describe, expect, it } from "vitest";
import {
  A11Y_CONTRAST_KEY,
  A11Y_TEXT_KEY,
  ONBOARDING_KEY,
  ONBOARDING_STEPS,
  normalizeContrastMode,
  normalizeTextSize,
} from "../../frontend/src/lib/accessibility.ts";

describe("accessibility preferences and guided onboarding", () => {
  it("accepts only the three supported text sizes", () => {
    expect(normalizeTextSize("normal")).toBe("normal");
    expect(normalizeTextSize("large")).toBe("large");
    expect(normalizeTextSize("extra")).toBe("extra");
    expect(normalizeTextSize("unknown")).toBe("normal");
    expect(normalizeTextSize(null)).toBe("normal");
  });

  it("does not allow unsupported contrast settings", () => {
    expect(normalizeContrastMode("high")).toBe("high");
    expect(normalizeContrastMode("standard")).toBe("standard");
    expect(normalizeContrastMode("unsafe")).toBe("standard");
  });

  it("provides four navigable steps and distinct local preference keys", () => {
    expect(ONBOARDING_STEPS).toHaveLength(4);
    for (const step of ONBOARDING_STEPS) {
      expect(step.title.length).toBeGreaterThan(3);
      expect(step.description.length).toBeGreaterThan(20);
      expect(step.href.startsWith("/")).toBe(true);
    }
    expect(new Set([A11Y_CONTRAST_KEY, A11Y_TEXT_KEY, ONBOARDING_KEY]).size).toBe(3);
  });
});
