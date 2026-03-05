import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { salesAccountSchema } from "@/lib/validations/sales-account";

type StatusFilter = "ALL" | "ENABLED" | "DISABLED";

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

  return { error: null, session };
}

export async function GET(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";
  const promoter = request.nextUrl.searchParams.get("promoter")?.trim() ?? "";
  const statusParam = request.nextUrl.searchParams.get("status")?.trim() ?? "ALL";
  const statusFilter: StatusFilter =
    statusParam === "ENABLED" || statusParam === "DISABLED" ? statusParam : "ALL";

  const where: Prisma.SalesAccountWhereInput = {};

  if (promoter) {
    where.promoter = promoter;
  }

  if (keyword) {
    where.OR = [{ wechatNickname: { contains: keyword } }, { wechatId: { contains: keyword } }];
  }

  if (statusFilter === "ENABLED") {
    where.isEnabled = true;
  }

  if (statusFilter === "DISABLED") {
    where.isEnabled = false;
  }

  const [accounts, promoterOptions] = await Promise.all([
    prisma.salesAccount.findMany({
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
    }),
    prisma.salesAccount.findMany({
      distinct: ["promoter"],
      orderBy: {
        promoter: "asc",
      },
      select: {
        promoter: true,
      },
    }),
  ]);

  return NextResponse.json({
    message: "查询成功",
    data: {
      accounts,
      promoters: promoterOptions.map((item) => item.promoter),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const parsed = salesAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
    }

    const data = parsed.data;
    let normalizedPromoter = data.promoter.trim();
    let promoterUserId: number | null = null;

    if (data.promoterUserId) {
      const selectedPromoterUser = await prisma.user.findFirst({
        where: {
          id: data.promoterUserId,
          role: "PROMOTER",
          isEnabled: true,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      });

      if (!selectedPromoterUser) {
        return NextResponse.json({ message: "所选发展人不存在或已停用" }, { status: 400 });
      }

      promoterUserId = selectedPromoterUser.id;
      normalizedPromoter = selectedPromoterUser.displayName?.trim() || selectedPromoterUser.username;
    } else {
      const matchedPromoterUser = await prisma.user.findFirst({
        where: {
          role: "PROMOTER",
          OR: [{ displayName: normalizedPromoter }, { username: normalizedPromoter }],
        },
        select: {
          id: true,
        },
      });

      promoterUserId = matchedPromoterUser?.id ?? null;
    }

    const created = await prisma.salesAccount.create({
      data: {
        promoter: normalizedPromoter,
        wechatNickname: data.wechatNickname.trim(),
        wechatId: data.wechatId.trim(),
        remark: data.remark?.trim() ? data.remark.trim() : null,
        createdById: auth.session.userId,
        promoterUserId,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      message: "销售账号创建成功",
      data: created,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "销售微信号已存在，请勿重复添加" }, { status: 409 });
    }

    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
