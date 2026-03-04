import { redirect } from "next/navigation";

import { PromoterSalesAccountManagement } from "@/components/promoter-sales-account-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function PromoterSalesAccountsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "PROMOTER") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>我的销售账号</CardTitle>
          <CardDescription>仅展示并管理你名下的销售账号数据，支持搜索、备注编辑与启停用。</CardDescription>
        </CardHeader>
        <CardContent>
          <PromoterSalesAccountManagement />
        </CardContent>
      </Card>
    </div>
  );
}
