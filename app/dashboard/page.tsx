import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/server";
import { ROLE_HOME } from "@/lib/config/navigation";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  redirect(ROLE_HOME[session.role]);
}
