import { z } from "zod";

export const publicRoles = ["STUDENT", "PARENT", "TUTOR"] as const;
export const allRoles = [...publicRoles, "ADMIN"] as const;

export const roleSchema = z.enum(allRoles);
export type Role = z.infer<typeof roleSchema>;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(128),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(publicRoles),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const createFamilySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const inviteStudentSchema = z.object({
  email: emailSchema,
  displayName: z.string().trim().min(2).max(80),
});

export const inviteTutorSchema = z.object({
  email: emailSchema,
  studentId: z.uuid(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(32),
});

export const activateAccountSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(12).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type InviteStudentInput = z.infer<typeof inviteStudentSchema>;
export type InviteTutorInput = z.infer<typeof inviteTutorSchema>;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  onboardingComplete: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
}
