import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { FamiliesModule } from "./families/families.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RelationshipsModule } from "./relationships/relationships.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
      validate: (environment: Record<string, unknown>) => {
        const jwtSecret = String(environment.JWT_SECRET ?? "");
        if (process.env.NODE_ENV === "production" && jwtSecret.length < 32) {
          throw new Error("JWT_SECRET must contain at least 32 characters in production");
        }
        return environment;
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FamiliesModule,
    RelationshipsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
