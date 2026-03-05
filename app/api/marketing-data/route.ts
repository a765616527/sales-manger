import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { formatDateKey, parseDateOnly } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { marketingDataCreateSchema } from "@/lib/validations/marketing-data";

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

export async function POST(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const normalizedInput = {
      ...body,
      salesAccountId: Number(body.salesAccountId),
      addFriendsCount: Number(body.addFriendsCount),
      conversionCount: Number(body.conversionCount),
      partTimeUserId:
        body.partTimeUserId === null || body.partTimeUserId === undefined || body.partTimeUserId === ""
          ? null
          : Number(body.partTimeUserId),
    };

    const parsed = marketingDataCreateSchema.safeParse(normalizedInput);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
    }

    const salesAccount = await prisma.salesAccount.findUnique({
      where: { id: parsed.data.salesAccountId },
      select: {
        id: true,
        isEnabled: true,
      },
    });

    if (!salesAccount) {
      return NextResponse.json({ message: "销售微信不存在" }, { status: 404 });
    }

    if (!salesAccount.isEnabled) {
      return NextResponse.json({ message: "该销售微信已停用，无法录入营销数据" }, { status: 400 });
    }

    if (parsed.data.partTimeUserId) {
      const partTime = await prisma.user.findUnique({
        where: { id: parsed.data.partTimeUserId },
        select: {
          id: true,
          role: true,
          isEnabled: true,
        },
      });

      if (!partTime || partTime.role !== "PART_TIME") {
        return NextResponse.json({ message: "兼职人员不存在" }, { status: 404 });
      }

      if (!partTime.isEnabled) {
        return NextResponse.json({ message: "兼职人员已停用，无法关联" }, { status: 400 });
      }
    }

    const day = parseDateOnly(parsed.data.date);
    if (!day) {
      return NextResponse.json({ message: "日期格式错误" }, { status: 400 });
    }

    const existed = await prisma.marketingData.findFirst({
      where: {
        date: day,
        salesAccountId: parsed.data.salesAccountId,
        partTimeUserId: parsed.data.partTimeUserId ?? null,
      },
      select: { id: true },
    });

    if (existed) {
      return NextResponse.json(
        {
          message: `该日期已存在营销数据记录（${formatDateKey(day)}），请勿重复录入`,
        },
        { status: 409 },
      );
    }

    const created = await prisma.marketingData.create({
      data: {
        date: day,
        salesAccountId: parsed.data.salesAccountId,
        addFriendsCount: parsed.data.addFriendsCount,
        conversionCount: parsed.data.conversionCount,
        partTimeUserId: parsed.data.partTimeUserId ?? null,
        createdById: auth.session.userId,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      message: "营销数据添加成功",
      data: created,
    });
  } catch {
    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

    const records = await prisma.marketingData.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        date: true,
        addFriendsCount: true,
        conversionCount: true,
        createdAt: true,
        salesAccount: {
          select: {
            id: true,
            promoter: true,
            wechatNickname: true,
            wechatId: true,
          },
        },
        partTimeUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        records,
      },
    });
  } catch {
    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
