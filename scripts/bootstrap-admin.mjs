import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

async function main() {
  const username = requiredEnv("ADMIN_INIT_USERNAME");
  const rawPassword = requiredEnv("ADMIN_INIT_PASSWORD");
  const displayName = process.env.ADMIN_INIT_DISPLAY_NAME?.trim() || "系统管理员";

  const password = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { username },
    update: {
      password,
      role: "ADMIN",
      displayName,
      isEnabled: true,
    },
    create: {
      username,
      password,
      role: "ADMIN",
      displayName,
      isEnabled: true,
    },
  });

  console.log(`[bootstrap-admin] 管理员账号已就绪：${username}`);
}

main()
  .catch((error) => {
    console.error("[bootstrap-admin] 初始化管理员失败", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
