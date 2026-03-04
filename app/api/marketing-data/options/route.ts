import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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

  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";

  const salesWhere = keyword
    ? {
        isEnabled: true,
        OR: [{ wechatNickname: { contains: keyword } }, { wechatId: { contains: keyword } }],
      }
    : {
        isEnabled: true,
      };

  const partTimeWhere = keyword
    ? {
        role: "PART_TIME",
        isEnabled: true,
        OR: [{ displayName: { contains: keyword } }, { username: { contains: keyword } }],
      }
    : {
        role: "PART_TIME",
        isEnabled: true,
      };

  const [salesAccounts, partTimeUsers] = await Promise.all([
    prisma.salesAccount.findMany({
      where: salesWhere,
      orderBy: [{ promoter: "asc" }, { wechatNickname: "asc" }],
      select: {
        id: true,
        promoter: true,
        wechatNickname: true,
        wechatId: true,
      },
      take: 200,
    }),
    prisma.user.findMany({
      where: partTimeWhere,
      orderBy: [{ displayName: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        displayName: true,
      },
      take: 200,
    }),
  ]);

  return NextResponse.json({
    message: "查询成功",
    data: {
      salesAccounts,
      partTimeUsers,
    },
  });
}
