import { NextRequest, NextResponse } from "next/server";

import { formatDateKey, parseDateOnly } from "@/lib/date";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "未登录或登录已失效" }, { status: 401 });
  }

  if (session.role !== "PART_TIME") {
    return NextResponse.json({ message: "无权限执行该操作" }, { status: 403 });
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

  const salesAccountIdRaw = request.nextUrl.searchParams.get("salesAccountId")?.trim() ?? "";
  const salesKeyword = request.nextUrl.searchParams.get("salesKeyword")?.trim() ?? "";
  const salesAccountId = salesAccountIdRaw ? Number(salesAccountIdRaw) : null;

  if (salesAccountIdRaw && (!Number.isInteger(salesAccountId) || (salesAccountId as number) <= 0)) {
    return NextResponse.json({ message: "销售微信参数不正确" }, { status: 400 });
  }

  const recordsWhere = {
    date: {
      gte: startDate,
      lte: endDate,
    },
    partTimeUserId: session.userId,
    salesAccount:
      salesAccountId !== null
        ? {
            id: salesAccountId,
          }
        : salesKeyword
          ? {
              OR: [{ wechatNickname: { contains: salesKeyword } }, { wechatId: { contains: salesKeyword } }],
            }
          : undefined,
  };

  const [records, salesAccountOptions] = await Promise.all([
    prisma.marketingData.findMany({
      where: recordsWhere,
      orderBy: [{ date: "asc" }, { salesAccountId: "asc" }],
      select: {
        date: true,
        addFriendsCount: true,
        salesAccountId: true,
        salesAccount: {
          select: {
            wechatNickname: true,
            wechatId: true,
          },
        },
      },
    }),
    prisma.salesAccount.findMany({
      where: {
        marketingData: {
          some: {
            partTimeUserId: session.userId,
          },
        },
      },
      orderBy: [{ wechatNickname: "asc" }, { wechatId: "asc" }],
      select: {
        id: true,
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

  const seriesMap = new Map<
    number,
    {
      key: string;
      label: string;
      wechatNickname: string;
      wechatId: string;
    }
  >();

  for (const item of records) {
    if (!seriesMap.has(item.salesAccountId)) {
      const key = `s_${item.salesAccountId}`;
      const label = item.salesAccount.wechatId;

      seriesMap.set(item.salesAccountId, {
        key,
        label,
        wechatNickname: item.salesAccount.wechatNickname,
        wechatId: item.salesAccount.wechatId,
      });
    }
  }

  const series = Array.from(seriesMap.values());

  const accountChart = dateKeys.map((date) => {
    const row: Record<string, string | number> = { date, total: 0 };

    for (const item of series) {
      row[item.key] = 0;
    }

    return row;
  });

  const chartMap = new Map(accountChart.map((item) => [item.date as string, item]));

  const endKey = formatDateKey(lastDate);

  let totalAddFriends = 0;
  let dailyAddFriends = 0;

  for (const item of records) {
    const date = formatDateKey(item.date);
    const seriesKey = `s_${item.salesAccountId}`;

    totalAddFriends += item.addFriendsCount;

    if (date === endKey) {
      dailyAddFriends += item.addFriendsCount;
    }

    const row = chartMap.get(date);
    if (row) {
      row[seriesKey] = Number(row[seriesKey] ?? 0) + item.addFriendsCount;
      row.total = Number(row.total ?? 0) + item.addFriendsCount;
    }
  }

  const activeSalesAccountCount = series.length;
  const recordCount = records.length;
  const averageDailyAddFriends = dateKeys.length > 0 ? totalAddFriends / dateKeys.length : 0;

  return NextResponse.json({
    message: "查询成功",
    data: {
      filters: {
        startDate: formatDateKey(startDate),
        endDate: formatDateKey(lastDate),
        salesKeyword,
        salesAccountId,
      },
      salesAccountOptions,
      series,
      accountChart,
      summary: {
        totalAddFriends,
        dailyAddFriends,
        activeSalesAccountCount,
        recordCount,
        averageDailyAddFriends,
      },
    },
  });
}
