import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ message: "退出成功" });

  clearSessionCookie(response);

  return response;
}
