import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        onboardingComplete: true,
        roles: { select: { role: true } },
        studentProfile: { select: { id: true, inviteCode: true, currentGrade: true, targetGrade: true } },
        tutorProfile: { select: { id: true, organisation: true } },
        familyMemberships: {
          select: { role: true, family: { select: { id: true, name: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");

    return {
      ...user,
      roles: user.roles.map(({ role }) => role),
    };
  }
}
