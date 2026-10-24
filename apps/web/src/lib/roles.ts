import type { Role } from "@achievers-hub/contracts";

export function primaryRole(roles: Role[]): Role {
  return (["ADMIN", "PARENT", "TUTOR", "STUDENT"] as Role[]).find((role) => roles.includes(role)) ?? "STUDENT";
}
