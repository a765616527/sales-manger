import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { getPromoterSalesAccountScope } from "@/lib/auth/scopes";
import { prisma } from "@/lib/prisma";

type StatusFilter = "ALL" | "ENABLED" | "DISABLED";

async function ensurePromoter(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return {
      error: NextResponse.json({ message: "未登录或登录已失效" }, { status: 401 }),
      session: null,
      scope: null,
    };
  }

  if (session.role !== "PROMOTER") {
    return {
      error: NextResponse.json({ message: "无权限执行该操作" }, { status: 403 }),
      session: null,
      scope: null,
    };
  }

  const scope = await getPromoterSalesAccountScope(session.userId);

  return {
    error: null,
    session,
    scope,
  };
}

export async function GET(request: NextRequest) {
  const auth = await ensurePromoter(request);
  if (auth.error) {
    return auth.error;
  }

  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";
  const statusParam = request.nextUrl.searchParams.get("status")?.trim() ?? "ALL";
  const statusFilter: StatusFilter =
    statusParam === "ENABLED" || statusParam === "DISABLED" ? statusParam : "ALL";

  const andConditions: Prisma.SalesAccountWhereInput[] = [auth.scope];

  if (keyword) {
    andConditions.push({
      OR: [{ wechatNickname: { contains: keyword } }, { wechatId: { contains: keyword } }],
    });
  }

  if (statusFilter === "ENABLED") {
    andConditions.push({ isEnabled: true });
  }

  if (statusFilter === "DISABLED") {
    andConditions.push({ isEnabled: false });
  }

  const where: Prisma.SalesAccountWhereInput = {
    AND: andConditions,
  };

  const accounts = await prisma.salesAccount.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      promoter: true,
      wechatNickname: true,
      wechatId: true,
      remark: true,
      isEnabled: true,
    },
  });

  return NextResponse.json({
    message: "查询成功",
    data: {
      accounts,
    },
  });
}
