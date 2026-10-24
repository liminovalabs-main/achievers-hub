import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InvitationStatus, InvitationType, Role, UserStatus } from "@achievers-hub/database";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AccessTokenPayload, AuthUser } from "./auth-user.interface";
import { ActivateAccountDto } from "./dto/activate-account.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const userSelection = {
  id: true,
  email: true,
  displayName: true,
  onboardingComplete: true,
  status: true,
  roles: { select: { role: true } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterDto) {
    if (input.role === Role.ADMIN) {
      throw new BadRequestException("Administrator accounts cannot self-register");
    }

    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("An account already exists for this email");

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName: input.displayName.trim(),
        passwordHash,
        status: UserStatus.ACTIVE,
        roles: { create: { role: input.role } },
        parentProfile: input.role === Role.PARENT ? { create: {} } : undefined,
        tutorProfile: input.role === Role.TUTOR ? { create: {} } : undefined,
        studentProfile:
          input.role === Role.STUDENT
            ? { create: { inviteCode: this.createInviteCode() } }
            : undefined,
      },
      select: userSelection,
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_REGISTERED",
        entityType: "User",
        entityId: user.id,
        metadata: { role: input.role },
      },
    });

    return this.issueSession(this.toAuthUser(user));
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      select: { ...userSelection, passwordHash: true },
    });

    if (!user?.passwordHash || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueSession(this.toAuthUser(user));
  }

  async activateStudent(input: ActivateAccountDto) {
    const tokenHash = this.hashToken(input.token);
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { family: true },
    });

    if (
      !invitation ||
      invitation.type !== InvitationType.STUDENT_ACCESS ||
      invitation.status !== InvitationStatus.PENDING ||
      invitation.expiresAt <= new Date() ||
      !invitation.familyId
    ) {
      throw new BadRequestException("This activation link is invalid or has expired");
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.$transaction(async (transaction) => {
      const pendingUser = await transaction.user.findUnique({ where: { email: invitation.email } });
      if (!pendingUser) throw new BadRequestException("Invited student account was not found");

      const updated = await transaction.user.update({
        where: { id: pendingUser.id },
        data: { passwordHash, status: UserStatus.ACTIVE },
        select: userSelection,
      });
      await transaction.familyMember.upsert({
        where: {
          familyId_userId: { familyId: invitation.familyId!, userId: pendingUser.id },
        },
        update: {},
        create: { familyId: invitation.familyId!, userId: pendingUser.id, role: "STUDENT" },
      });
      await transaction.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedById: pendingUser.id,
          acceptedAt: new Date(),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: pendingUser.id,
          action: "STUDENT_INVITATION_ACCEPTED",
          entityType: "Family",
          entityId: invitation.familyId!,
        },
      });
      return updated;
    });

    return this.issueSession(this.toAuthUser(user));
  }

  private async issueSession(user: AuthUser) {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, roles: user.roles };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_SECRET", "development-secret-change-this-value"),
      expiresIn: this.config.get<string>("JWT_EXPIRES_IN", "15m") as never,
    });
    return { accessToken, user };
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    displayName: string;
    onboardingComplete: boolean;
    roles: Array<{ role: Role }>;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      onboardingComplete: user.onboardingComplete,
      roles: user.roles.map(({ role }) => role),
    };
  }

  private createInviteCode() {
    return randomBytes(5).toString("hex").toUpperCase();
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
