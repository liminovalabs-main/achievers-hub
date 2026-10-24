import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@achievers-hub/database";
import { describe, expect, it, vi } from "vitest";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  it("allows a user with a required role", () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([Role.PARENT]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [Role.PARENT] } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks a user without a required role", () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([Role.ADMIN]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [Role.STUDENT] } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });
});
