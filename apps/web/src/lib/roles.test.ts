import { describe, expect, it } from "vitest";
import { primaryRole } from "./roles";

describe("primaryRole", () => {
  it("uses the highest privileged workspace for multi-role users", () => {
    expect(primaryRole(["STUDENT", "PARENT"])).toBe("PARENT");
    expect(primaryRole(["TUTOR", "ADMIN"])).toBe("ADMIN");
  });

  it("defaults safely to the student workspace", () => {
    expect(primaryRole([])).toBe("STUDENT");
  });
});
