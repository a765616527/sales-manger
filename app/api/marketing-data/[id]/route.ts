import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "未登录或登录已失效" }, { status: 401 });
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "无权限执行该操作" }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "无效的记录 ID" }, { status: 400 });
  }

  try {
    await prisma.marketingData.delete({
      where: { id },
      select: { id: true },
    });

    return NextResponse.json({
      message: "营销记录删除成功",
      data: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "营销记录不存在或已删除" }, { status: 404 });
    }

    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
