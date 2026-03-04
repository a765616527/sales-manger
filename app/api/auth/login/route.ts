import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { attachSessionCookie } from "@/lib/auth/session";
import { isAppRole } from "@/lib/auth/types";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/login";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        isEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    if (!user.isEnabled) {
      return NextResponse.json({ message: "账号已被停用，请联系管理员" }, { status: 403 });
    }

    if (!isAppRole(user.role)) {
      return NextResponse.json({ message: "账号角色配置异常，请联系管理员" }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const response = NextResponse.json({
      message: "登录成功",
      data: {
        username: user.username,
        role: user.role,
      },
    });

    attachSessionCookie(response, {
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
