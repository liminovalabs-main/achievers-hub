import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  FamilyMemberRole,
  InvitationStatus,
  InvitationType,
  Role,
  UserStatus,
} from "@achievers-hub/database";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AcceptStudentInvitationDto } from "./dto/accept-student-invitation.dto";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { InviteStudentDto } from "./dto/invite-student.dto";

@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  listForParent(parentId: string) {
    return this.prisma.family.findMany({
      where: { members: { some: { userId: parentId, role: FamilyMemberRole.PARENT } } },
      orderBy: { createdAt: "asc" },
      include: {
        members: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                status: true,
                onboardingComplete: true,
                studentProfile: { select: { id: true, inviteCode: true } },
              },
            },
          },
        },
        invitations: {
          where: { status: InvitationStatus.PENDING },
          select: { id: true, type: true, email: true, expiresAt: true, createdAt: true },
        },
      },
    });
  }

  async create(parentId: string, input: CreateFamilyDto) {
    const family = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.family.create({
        data: {
          name: input.name.trim(),
          members: { create: { userId: parentId, role: FamilyMemberRole.PARENT } },
        },
      });
      await transaction.user.update({
        where: { id: parentId },
        data: { onboardingComplete: true },
      });
      await transaction.auditLog.create({
        data: {
          actorId: parentId,
          action: "FAMILY_CREATED",
          entityType: "Family",
          entityId: created.id,
        },
      });
      return created;
    });
    return family;
  }

  async inviteStudent(parentId: string, familyId: string, input: InviteStudentDto) {
    await this.assertParentMember(parentId, familyId);
    const email = input.email.trim().toLowerCase();
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (transaction) => {
      let student = await transaction.user.findUnique({
        where: { email },
        include: { roles: true, studentProfile: true },
      });

      if (student && !student.roles.some(({ role }) => role === Role.STUDENT)) {
        throw new ConflictException("This email belongs to a non-student account");
      }

      if (!student) {
        student = await transaction.user.create({
          data: {
            email,
            displayName: input.displayName.trim(),
            status: UserStatus.PENDING,
            roles: { create: { role: Role.STUDENT } },
            studentProfile: { create: { inviteCode: this.createInviteCode() } },
          },
          include: { roles: true, studentProfile: true },
        });
      }

      if (!student.studentProfile) {
        throw new BadRequestException("Student profile is unavailable");
      }

      const existingMembership = await transaction.familyMember.findUnique({
        where: { familyId_userId: { familyId, userId: student.id } },
      });
      if (existingMembership) throw new ConflictException("Student already belongs to this family");

      await transaction.invitation.updateMany({
        where: {
          familyId,
          email,
          type: InvitationType.STUDENT_ACCESS,
          status: InvitationStatus.PENDING,
        },
        data: { status: InvitationStatus.REVOKED },
      });

      const invitation = await transaction.invitation.create({
        data: {
          type: InvitationType.STUDENT_ACCESS,
          email,
          tokenHash,
          familyId,
          studentId: student.studentProfile.id,
          createdById: parentId,
          expiresAt,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: parentId,
          action: "STUDENT_INVITED",
          entityType: "Invitation",
          entityId: invitation.id,
          metadata: { familyId, email },
        },
      });
      return invitation;
    });

    return {
      id: result.id,
      email: result.email,
      expiresAt: result.expiresAt,
      activationToken: rawToken,
      activationPath: `/activate?token=${rawToken}`,
      delivery: "manual",
    };
  }

  async acceptStudentInvitation(studentId: string, studentEmail: string, input: AcceptStudentInvitationDto) {
    const tokenHash = this.hashToken(input.token);
    const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash } });

    if (
      !invitation ||
      invitation.type !== InvitationType.STUDENT_ACCESS ||
      invitation.status !== InvitationStatus.PENDING ||
      invitation.expiresAt <= new Date() ||
      invitation.email !== studentEmail.toLowerCase() ||
      !invitation.familyId
    ) {
      throw new BadRequestException("This invitation is invalid or has expired");
    }

    await this.prisma.$transaction([
      this.prisma.familyMember.upsert({
        where: { familyId_userId: { familyId: invitation.familyId, userId: studentId } },
        update: {},
        create: { familyId: invitation.familyId, userId: studentId, role: FamilyMemberRole.STUDENT },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedById: studentId, acceptedAt: new Date() },
      }),
      this.prisma.user.update({ where: { id: studentId }, data: { onboardingComplete: true } }),
      this.prisma.auditLog.create({
        data: {
          actorId: studentId,
          action: "STUDENT_INVITATION_ACCEPTED",
          entityType: "Family",
          entityId: invitation.familyId,
        },
      }),
    ]);

    return { accepted: true, familyId: invitation.familyId };
  }

  private async assertParentMember(parentId: string, familyId: string) {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId: parentId, role: FamilyMemberRole.PARENT },
    });
    if (!membership) throw new ForbiddenException("You cannot manage this family");
  }

  private createInviteCode() {
    return randomBytes(5).toString("hex").toUpperCase();
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
