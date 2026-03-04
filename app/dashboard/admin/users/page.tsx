import { redirect } from "next/navigation";

import { UserManagement } from "@/components/user-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function UserManagementPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>统一管理管理员、发展人、兼职用户，支持筛选、创建、编辑、启停用。</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagement currentUserId={session.userId} />
        </CardContent>
      </Card>
    </div>
  );
}
