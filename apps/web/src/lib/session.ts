import type { Role, SessionUser } from "@achievers-hub/contracts";
import { redirect } from "next/navigation";
import { ApiError, apiRequest } from "./api";
export { primaryRole } from "./roles";

export interface CurrentUser extends SessionUser {
  studentProfile?: {
    id: string;
    inviteCode: string;
    currentGrade: string | null;
    targetGrade: string | null;
  } | null;
  tutorProfile?: { id: string; organisation: string | null } | null;
  familyMemberships?: Array<{
    role: "PARENT" | "STUDENT";
    family: { id: string; name: string };
  }>;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const previewRole = process.env.NODE_ENV !== "production" ? process.env.ACHIEVERS_PREVIEW_ROLE as Role | undefined : undefined;
  if (previewRole && ["STUDENT", "PARENT", "TUTOR", "ADMIN"].includes(previewRole)) {
    return {
      id: "00000000-0000-4000-8000-000000000001",
      email: `${previewRole.toLowerCase()}@preview.local`,
      displayName: previewRole === "PARENT" ? "Jordan Morgan" : `${previewRole.charAt(0)}${previewRole.slice(1).toLowerCase()} Preview`,
      roles: [previewRole],
      onboardingComplete: false,
      studentProfile: previewRole === "STUDENT" ? { id: "00000000-0000-4000-8000-000000000002", inviteCode: "A1B2C3D4E5", currentGrade: null, targetGrade: null } : null,
      tutorProfile: previewRole === "TUTOR" ? { id: "00000000-0000-4000-8000-000000000003", organisation: null } : null,
      familyMemberships: [],
    };
  }

  try {
    return await apiRequest<CurrentUser>("/users/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
