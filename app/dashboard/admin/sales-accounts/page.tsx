import { redirect } from "next/navigation";

import { SalesAccountManagement } from "@/components/sales-account-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function SalesAccountsManagementPage() {
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
          <CardTitle>销售账号管理</CardTitle>
          <CardDescription>
            支持按发展人筛选、关键词搜索（微信昵称或微信号）、编辑备注，以及停用/启用状态管理。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesAccountManagement />
        </CardContent>
      </Card>
    </div>
  );
}
