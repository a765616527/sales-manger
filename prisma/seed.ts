import bcrypt from "bcryptjs";

import type { AppRole } from "../lib/auth/types";
import { prisma } from "../lib/prisma";

async function upsertUser(params: {
  username: string;
  rawPassword: string;
  role: AppRole;
  displayName: string;
  isEnabled?: boolean;
}) {
  const password = await bcrypt.hash(params.rawPassword, 10);

  await prisma.user.upsert({
    where: { username: params.username },
    update: {
      password,
      role: params.role,
      displayName: params.displayName,
      isEnabled: params.isEnabled ?? true,
    },
    create: {
      username: params.username,
      password,
      role: params.role,
      displayName: params.displayName,
      isEnabled: params.isEnabled ?? true,
    },
  });
}

async function main() {
  await upsertUser({
    username: process.env.ADMIN_INIT_USERNAME ?? "admin",
    rawPassword: process.env.ADMIN_INIT_PASSWORD ?? "admin123456",
    role: "ADMIN",
    displayName: "系统管理员",
  });

  await upsertUser({
    username: "promoter_zhang",
    rawPassword: "promoter123",
    role: "PROMOTER",
    displayName: "发展人张三",
  });

  await upsertUser({
    username: "promoter_li",
    rawPassword: "promoter123",
    role: "PROMOTER",
    displayName: "发展人李四",
  });

  await upsertUser({
    username: "parttime_liu",
    rawPassword: "parttime123",
    role: "PART_TIME",
    displayName: "兼职刘一",
  });

  await upsertUser({
    username: "parttime_wang",
    rawPassword: "parttime123",
    role: "PART_TIME",
    displayName: "兼职王二",
  });

  const admin = await prisma.user.findUnique({
    where: { username: process.env.ADMIN_INIT_USERNAME ?? "admin" },
    select: { id: true },
  });

  if (!admin) {
    throw new Error("管理员不存在，无法初始化种子数据。");
  }

  const promoterZhang = await prisma.user.findUnique({
    where: { username: "promoter_zhang" },
    select: { id: true, displayName: true },
  });

  const promoterLi = await prisma.user.findUnique({
    where: { username: "promoter_li" },
    select: { id: true, displayName: true },
  });

  await prisma.salesAccount.upsert({
    where: { wechatId: "sale_demo_001" },
    update: {
      promoter: promoterZhang?.displayName ?? "发展人张三",
      wechatNickname: "演示销售A",
      remark: "示例数据：正常启用",
      isEnabled: true,
      promoterUserId: promoterZhang?.id ?? null,
    },
    create: {
      promoter: promoterZhang?.displayName ?? "发展人张三",
      wechatNickname: "演示销售A",
      wechatId: "sale_demo_001",
      remark: "示例数据：正常启用",
      isEnabled: true,
      createdById: admin.id,
      promoterUserId: promoterZhang?.id ?? null,
    },
  });

  await prisma.salesAccount.upsert({
    where: { wechatId: "sale_demo_002" },
    update: {
      promoter: promoterLi?.displayName ?? "发展人李四",
      wechatNickname: "演示销售B",
      remark: "示例数据：已停用",
      isEnabled: false,
      promoterUserId: promoterLi?.id ?? null,
    },
    create: {
      promoter: promoterLi?.displayName ?? "发展人李四",
      wechatNickname: "演示销售B",
      wechatId: "sale_demo_002",
      remark: "示例数据：已停用",
      isEnabled: false,
      createdById: admin.id,
      promoterUserId: promoterLi?.id ?? null,
    },
  });

  const enabledSales = await prisma.salesAccount.findMany({
    where: { isEnabled: true },
    select: { id: true },
    take: 1,
  });

  const partTime = await prisma.user.findFirst({
    where: { role: "PART_TIME", isEnabled: true },
    select: { id: true },
  });

  if (enabledSales[0]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      await prisma.marketingData.create({
        data: {
          date: d,
          addFriendsCount: 10 + i,
          conversionCount: 3 + Math.floor(i / 2),
          salesAccountId: enabledSales[0].id,
          partTimeUserId: partTime?.id,
          createdById: admin.id,
        },
      });
    }
  }

  console.log("种子数据初始化完成。示例账号：admin / promoter_zhang / parttime_liu");
}

main()
  .catch((error) => {
    console.error("种子数据初始化失败", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
