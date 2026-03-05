import { redirect } from "next/navigation";

import { PromoterMarketingDashboard } from "@/components/promoter-marketing-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function PromoterMarketingDashboardPage() {
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
          <CardTitle>我的营销看板</CardTitle>
          <CardDescription>
            仅查看自己名下销售账号营销数据，支持按销售微信（可搜索选择）和时间范围筛选，并查看折线趋势。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromoterMarketingDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
