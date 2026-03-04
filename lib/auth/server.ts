import { cookies } from "next/headers";

import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return parseSessionToken(token);
}
