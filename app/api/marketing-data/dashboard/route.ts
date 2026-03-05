import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { formatDateKey, parseDateOnly } from "@/lib/date";
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

function normalizeDate(raw: string | null, fallback: Date) {
  if (!raw) {
    return fallback;
  }

  const parsed = parseDateOnly(raw);
  if (!parsed) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 29);

  let startDate = normalizeDate(request.nextUrl.searchParams.get("startDate"), defaultStart);
  let endDate = normalizeDate(request.nextUrl.searchParams.get("endDate"), today);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (startDate.getTime() > endDate.getTime()) {
    [startDate, endDate] = [new Date(endDate), new Date(startDate)];
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const promoter = request.nextUrl.searchParams.get("promoter")?.trim() ?? "";
  const salesKeyword = request.nextUrl.searchParams.get("salesKeyword")?.trim() ?? "";
  const salesAccountIdRaw = request.nextUrl.searchParams.get("salesAccountId")?.trim() ?? "";
  const partTimeUserIdRaw = request.nextUrl.searchParams.get("partTimeUserId")?.trim() ?? "";
  const salesAccountId = salesAccountIdRaw ? Number(salesAccountIdRaw) : null;
  const partTimeUserId = partTimeUserIdRaw ? Number(partTimeUserIdRaw) : null;

  if (salesAccountIdRaw && (!Number.isInteger(salesAccountId) || (salesAccountId as number) <= 0)) {
    return NextResponse.json({ message: "销售微信参数不正确" }, { status: 400 });
  }

  if (partTimeUserIdRaw && (!Number.isInteger(partTimeUserId) || (partTimeUserId as number) <= 0)) {
    return NextResponse.json({ message: "兼职人员参数不正确" }, { status: 400 });
  }

  const where: Prisma.MarketingDataWhereInput = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (partTimeUserId) {
    where.partTimeUserId = partTimeUserId;
  }

  if (salesAccountId) {
    where.salesAccountId = salesAccountId;
  }

  const salesAccountWhere: Prisma.SalesAccountWhereInput = {};

  if (promoter) {
    salesAccountWhere.promoter = promoter;
  }

  if (salesKeyword && !salesAccountId) {
    salesAccountWhere.OR = [{ wechatNickname: { contains: salesKeyword } }, { wechatId: { contains: salesKeyword } }];
  }

  if (Object.keys(salesAccountWhere).length > 0) {
    where.salesAccount = salesAccountWhere;
  }

  const [records, promoterOptions, partTimeOptions, salesAccountOptions] = await Promise.all([
    prisma.marketingData.findMany({
      where,
      orderBy: [{ date: "asc" }, { salesAccountId: "asc" }],
      select: {
        date: true,
        addFriendsCount: true,
        conversionCount: true,
      },
    }),
    prisma.salesAccount.findMany({
      distinct: ["promoter"],
      orderBy: { promoter: "asc" },
      select: { promoter: true },
    }),
    prisma.user.findMany({
      where: {
        role: "PART_TIME",
        isEnabled: true,
      },
      orderBy: [{ displayName: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    }),
    prisma.salesAccount.findMany({
      where: promoter
        ? salesAccountId
          ? {
              OR: [{ promoter }, { id: salesAccountId }],
            }
          : { promoter }
        : undefined,
      orderBy: [{ promoter: "asc" }, { wechatNickname: "asc" }],
      select: {
        id: true,
        promoter: true,
        wechatNickname: true,
        wechatId: true,
      },
    }),
  ]);

  const dateKeys: string[] = [];
  const cursorDate = new Date(startDate);
  cursorDate.setHours(0, 0, 0, 0);

  const lastDate = new Date(endDate);
  lastDate.setHours(0, 0, 0, 0);

  while (cursorDate.getTime() <= lastDate.getTime()) {
    dateKeys.push(formatDateKey(cursorDate));
    cursorDate.setDate(cursorDate.getDate() + 1);
  }

  const trendChart = dateKeys.map((date) => ({
    date,
    addFriends: 0,
    conversions: 0,
  }));
  const trendMap = new Map(trendChart.map((item) => [item.date, item]));

  const endKey = formatDateKey(lastDate);

  let totalAddFriends = 0;
  let totalConversions = 0;
  let dailyAddFriends = 0;
  let dailyConversions = 0;

  for (const item of records) {
    const date = formatDateKey(item.date);

    totalAddFriends += item.addFriendsCount;
    totalConversions += item.conversionCount;

    if (date === endKey) {
      dailyAddFriends += item.addFriendsCount;
      dailyConversions += item.conversionCount;
    }

    const trendRow = trendMap.get(date);
    if (trendRow) {
      trendRow.addFriends += item.addFriendsCount;
      trendRow.conversions += item.conversionCount;
    }
  }

  return NextResponse.json({
    message: "查询成功",
    data: {
      filters: {
        startDate: formatDateKey(startDate),
        endDate: formatDateKey(lastDate),
        promoter,
        salesKeyword,
        salesAccountId,
        partTimeUserId,
      },
      promoterOptions: promoterOptions.map((item) => item.promoter),
      partTimeOptions,
      salesAccountOptions,
      trendChart,
      summary: {
        totalAddFriends,
        totalConversions,
        totalConversionRate: totalAddFriends > 0 ? totalConversions / totalAddFriends : 0,
        dailyAddFriends,
        dailyConversions,
        dailyConversionRate: dailyAddFriends > 0 ? dailyConversions / dailyAddFriends : 0,
      },
    },
  });
}
