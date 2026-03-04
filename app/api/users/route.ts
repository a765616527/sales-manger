import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { APP_ROLES } from "@/lib/auth/types";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validations/user";

function ensureAdmin(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return {
      error: NextResponse.json({ message: "未登录或登录已失效" }, { status: 401 }),
      session: null,
    };
  }

  if (session.role !== "ADMIN") {
    return {
      error: NextResponse.json({ message: "无权限执行该操作" }, { status: 403 }),
      session: null,
    };
  }

  return {
    error: null,
    session,
  };
}

export async function GET(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const role = request.nextUrl.searchParams.get("role")?.trim() ?? "ALL";
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";
  const status = request.nextUrl.searchParams.get("status")?.trim() ?? "ALL";

  const where: Prisma.UserWhereInput = {};

  if (role !== "ALL" && APP_ROLES.includes(role as (typeof APP_ROLES)[number])) {
    where.role = role;
  }

  if (status === "ENABLED") {
    where.isEnabled = true;
  }

  if (status === "DISABLED") {
    where.isEnabled = false;
  }

  if (keyword) {
    where.OR = [{ username: { contains: keyword } }, { displayName: { contains: keyword } }];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isEnabled: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    message: "查询成功",
    data: users,
  });
}

export async function POST(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const created = await prisma.user.create({
      data: {
        username: parsed.data.username,
        password: passwordHash,
        displayName: parsed.data.displayName,
        role: parsed.data.role,
        isEnabled: true,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      message: "用户创建成功",
      data: created,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "账号已存在，请更换账号" }, { status: 409 });
    }

    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
