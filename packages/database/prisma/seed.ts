import { PrismaClient, Role, UserStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@achievershub.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me-before-use";
  const passwordHash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      status: UserStatus.ACTIVE,
      onboardingComplete: true,
    },
    create: {
      email,
      displayName: "Platform administrator",
      passwordHash,
      status: UserStatus.ACTIVE,
      onboardingComplete: true,
      roles: { create: { role: Role.ADMIN } },
    },
  });

  console.log(`Administrator ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
