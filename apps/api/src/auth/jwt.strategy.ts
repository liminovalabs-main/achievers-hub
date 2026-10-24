import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { UserStatus } from "@achievers-hub/database";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AccessTokenPayload, AuthUser } from "./auth-user.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET", "development-secret-change-this-value"),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        onboardingComplete: true,
        roles: { select: { role: true } },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is unavailable");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      onboardingComplete: user.onboardingComplete,
      roles: user.roles.map(({ role }) => role),
    };
  }
}
