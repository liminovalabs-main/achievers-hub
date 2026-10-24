import { describe, expect, it } from "vitest";
import { registerSchema } from "./index.js";

describe("registerSchema", () => {
  it("normalises email addresses", () => {
    const result = registerSchema.parse({
      email: " Learner@Example.COM ",
      password: "correct-horse-battery-staple",
      displayName: "A Learner",
      role: "STUDENT",
    });

    expect(result.email).toBe("learner@example.com");
  });

  it("rejects administrator self-registration", () => {
    expect(() =>
      registerSchema.parse({
        email: "admin@example.com",
        password: "correct-horse-battery-staple",
        displayName: "Admin",
        role: "ADMIN",
      }),
    ).toThrow();
  });
});
