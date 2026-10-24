import { Role } from "@achievers-hub/database";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  onboardingComplete: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: Role[];
}
