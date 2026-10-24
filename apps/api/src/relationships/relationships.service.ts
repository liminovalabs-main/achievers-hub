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
  TutorLinkStatus,
} from "@achievers-hub/database";
import { createHash, randomBytes } from "node:crypto";
import { AuthUser } from "../auth/auth-user.interface";
import { PrismaService } from "../prisma/prisma.service";
import { AcceptTutorInvitationDto } from "./dto/accept-tutor-invitation.dto";
import { DecideTutorLinkDto } from "./dto/decide-tutor-link.dto";
import { InviteTutorDto } from "./dto/invite-tutor.dto";
import { RequestStudentAccessDto } from "./dto/request-student-access.dto";

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    if (user.roles.includes(Role.PARENT)) {
      const familyIds = await this.parentFamilyIds(user.id);
      return this.prisma.tutorStudentLink.findMany({
        where: { student: { user: { familyMemberships: { some: { familyId: { in: familyIds } } } } } },
        include: {
          tutor: { select: { id: true, user: { select: { displayName: true, email: true } } } },
          student: { select: { id: true, user: { select: { displayName: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (user.roles.includes(Role.TUTOR)) {
      return this.prisma.tutorStudentLink.findMany({
        where: { tutor: { userId: user.id } },
        include: { student: { select: { id: true, user: { select: { displayName: true } } } } },
        orderBy: { createdAt: "desc" },
      });
    }

    return this.prisma.tutorStudentLink.findMany({
      where: { student: { userId: user.id } },
      include: { tutor: { select: { id: true, user: { select: { displayName: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async inviteTutor(parentId: string, input: InviteTutorDto) {
    await this.assertParentControlsStudent(parentId, input.studentId);
    const email = input.email.trim().toLowerCase();
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const tutor = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
    if (tutor && !tutor.roles.some(({ role }) => role === Role.TUTOR)) {
      throw new ConflictException("This email belongs to a non-tutor account");
    }

    const invitation = await this.prisma.$transaction(async (transaction) => {
      await transaction.invitation.updateMany({
        where: {
          email,
          studentId: input.studentId,
          type: InvitationType.TUTOR_ACCESS,
          status: InvitationStatus.PENDING,
        },
        data: { status: InvitationStatus.REVOKED },
      });
      const created = await transaction.invitation.create({
        data: {
          type: InvitationType.TUTOR_ACCESS,
          email,
          tokenHash,
          studentId: input.studentId,
          createdById: parentId,
          expiresAt,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: parentId,
          action: "TUTOR_INVITED",
          entityType: "Invitation",
          entityId: created.id,
          metadata: { studentId: input.studentId, email },
        },
      });
      return created;
    });

    return {
      id: invitation.id,
      email,
      expiresAt,
      invitationToken: rawToken,
      invitationPath: `/onboarding?tutorInvite=${rawToken}`,
      delivery: "manual",
    };
  }

  async acceptTutorInvitation(tutorUserId: string, tutorEmail: string, input: AcceptTutorInvitationDto) {
    const tokenHash = this.hashToken(input.token);
    const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash } });
    if (
      !invitation ||
      invitation.type !== InvitationType.TUTOR_ACCESS ||
      invitation.status !== InvitationStatus.PENDING ||
      invitation.expiresAt <= new Date() ||
      invitation.email !== tutorEmail.toLowerCase() ||
      !invitation.studentId
    ) {
      throw new BadRequestException("This invitation is invalid or has expired");
    }

    await this.assertParentControlsStudent(invitation.createdById, invitation.studentId);

    const tutorProfile = await this.prisma.tutorProfile.findUnique({ where: { userId: tutorUserId } });
    if (!tutorProfile) throw new ForbiddenException("Tutor profile is unavailable");

    const link = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.tutorStudentLink.upsert({
        where: { tutorId_studentId: { tutorId: tutorProfile.id, studentId: invitation.studentId! } },
        update: {
          status: TutorLinkStatus.ACTIVE,
          approvedByParentId: invitation.createdById,
          approvedAt: new Date(),
        },
        create: {
          tutorId: tutorProfile.id,
          studentId: invitation.studentId!,
          status: TutorLinkStatus.ACTIVE,
          approvedByParentId: invitation.createdById,
          approvedAt: new Date(),
        },
      });
      await transaction.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedById: tutorUserId, acceptedAt: new Date() },
      });
      await transaction.user.update({ where: { id: tutorUserId }, data: { onboardingComplete: true } });
      await transaction.auditLog.create({
        data: {
          actorId: tutorUserId,
          action: "TUTOR_INVITATION_ACCEPTED",
          entityType: "TutorStudentLink",
          entityId: created.id,
        },
      });
      return created;
    });
    return link;
  }

  async requestStudentAccess(tutorUserId: string, input: RequestStudentAccessDto) {
    const [tutor, student] = await Promise.all([
      this.prisma.tutorProfile.findUnique({ where: { userId: tutorUserId } }),
      this.prisma.studentProfile.findUnique({ where: { inviteCode: input.inviteCode.toUpperCase() } }),
    ]);
    if (!tutor) throw new ForbiddenException("Tutor profile is unavailable");
    if (!student) throw new NotFoundException("Student invite code was not found");

    const link = await this.prisma.tutorStudentLink.upsert({
      where: { tutorId_studentId: { tutorId: tutor.id, studentId: student.id } },
      update: { status: TutorLinkStatus.PENDING, approvedByParentId: null, approvedAt: null },
      create: { tutorId: tutor.id, studentId: student.id, status: TutorLinkStatus.PENDING },
    });
    await this.prisma.user.update({ where: { id: tutorUserId }, data: { onboardingComplete: true } });
    await this.prisma.auditLog.create({
      data: {
        actorId: tutorUserId,
        action: "TUTOR_ACCESS_REQUESTED",
        entityType: "TutorStudentLink",
        entityId: link.id,
      },
    });
    return link;
  }

  async decide(parentId: string, linkId: string, input: DecideTutorLinkDto) {
    const link = await this.prisma.tutorStudentLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException("Tutor relationship not found");
    await this.assertParentControlsStudent(parentId, link.studentId);
    if (link.status !== TutorLinkStatus.PENDING) {
      throw new BadRequestException("Only pending tutor requests can be decided");
    }

    const status = input.approved ? TutorLinkStatus.ACTIVE : TutorLinkStatus.REJECTED;
    const updated = await this.prisma.tutorStudentLink.update({
      where: { id: linkId },
      data: {
        status,
        approvedByParentId: input.approved ? parentId : null,
        approvedAt: input.approved ? new Date() : null,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId: parentId,
        action: input.approved ? "TUTOR_ACCESS_APPROVED" : "TUTOR_ACCESS_REJECTED",
        entityType: "TutorStudentLink",
        entityId: linkId,
      },
    });
    return updated;
  }

  async revoke(parentId: string, linkId: string) {
    const link = await this.prisma.tutorStudentLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException("Tutor relationship not found");
    await this.assertParentControlsStudent(parentId, link.studentId);

    const updated = await this.prisma.tutorStudentLink.update({
      where: { id: linkId },
      data: { status: TutorLinkStatus.REVOKED },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId: parentId,
        action: "TUTOR_ACCESS_REVOKED",
        entityType: "TutorStudentLink",
        entityId: linkId,
      },
    });
    return updated;
  }

  private async assertParentControlsStudent(parentId: string, studentProfileId: string) {
    const familyIds = await this.parentFamilyIds(parentId);
    const membership = await this.prisma.familyMember.findFirst({
      where: {
        familyId: { in: familyIds },
        role: FamilyMemberRole.STUDENT,
        user: { studentProfile: { id: studentProfileId } },
      },
    });
    if (!membership) throw new ForbiddenException("You cannot manage access to this student");
  }

  private async parentFamilyIds(parentId: string) {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId: parentId, role: FamilyMemberRole.PARENT },
      select: { familyId: true },
    });
    return memberships.map(({ familyId }) => familyId);
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
