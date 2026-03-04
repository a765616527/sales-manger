import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validations/user";

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
    return NextResponse.json({ message: "无效的用户 ID" }, { status: 400 });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isEnabled: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (parsed.data.displayName !== undefined) {
      updateData.displayName = parsed.data.displayName;
    }

    if (parsed.data.role !== undefined) {
      if (targetUser.id === session.userId && parsed.data.role !== "ADMIN") {
        return NextResponse.json({ message: "不允许将当前登录管理员改为非管理员角色" }, { status: 400 });
      }

      if (targetUser.role === "ADMIN" && targetUser.isEnabled && parsed.data.role !== "ADMIN") {
        const enabledAdminCount = await prisma.user.count({
          where: {
            role: "ADMIN",
            isEnabled: true,
          },
        });

        if (enabledAdminCount <= 1) {
          return NextResponse.json({ message: "系统至少需要保留一个启用中的管理员" }, { status: 400 });
        }
      }

      updateData.role = parsed.data.role;
    }

    if (parsed.data.isEnabled !== undefined) {
      if (targetUser.id === session.userId && parsed.data.isEnabled === false) {
        return NextResponse.json({ message: "不允许停用当前登录管理员账号" }, { status: 400 });
      }

      if (targetUser.role === "ADMIN" && targetUser.isEnabled && parsed.data.isEnabled === false) {
        const enabledAdminCount = await prisma.user.count({
          where: {
            role: "ADMIN",
            isEnabled: true,
          },
        });

        if (enabledAdminCount <= 1) {
          return NextResponse.json({ message: "系统至少需要保留一个启用中的管理员" }, { status: 400 });
        }
      }

      updateData.isEnabled = parsed.data.isEnabled;
    }

    if (parsed.data.resetPassword !== undefined) {
      updateData.password = await bcrypt.hash(parsed.data.resetPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      message: "用户更新成功",
      data: updated,
    });
  } catch {
    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
