import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const updateSalesAccountSchema = z
  .object({
    remark: z.string().max(500, "备注最多 500 字").optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine((data) => data.remark !== undefined || data.isEnabled !== undefined, {
    message: "至少更新一个字段",
  });

export async function PATCH(
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
    return NextResponse.json({ message: "无效的账号 ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateSalesAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
    }

    const updateData: Prisma.SalesAccountUpdateInput = {};

    if (parsed.data.remark !== undefined) {
      const remark = parsed.data.remark.trim();
      updateData.remark = remark.length > 0 ? remark : null;
    }

    if (parsed.data.isEnabled !== undefined) {
      updateData.isEnabled = parsed.data.isEnabled;
    }

    const updated = await prisma.salesAccount.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        remark: true,
        isEnabled: true,
      },
    });

    return NextResponse.json({
      message: "更新成功",
      data: updated,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "销售账号不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
