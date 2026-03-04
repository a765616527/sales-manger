import { redirect } from "next/navigation";

import { MarketingDashboard } from "@/components/marketing-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function MarketingDashboardPage() {
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
          <CardTitle>营销数据看板</CardTitle>
          <CardDescription>
            支持筛选发展人、销售微信号昵称/微信号、兼职人员、时间范围，并展示折线图与统计汇总。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarketingDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
