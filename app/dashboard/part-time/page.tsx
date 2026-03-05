import { redirect } from "next/navigation";

import { PartTimeMarketingDashboard } from "@/components/part-time-marketing-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function PartTimePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "PART_TIME") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>我的营销看板</CardTitle>
          <CardDescription>
            仅查看自己负责的营销数据，支持按销售微信（可搜索选择）和时间范围筛选，查看每日添加好友趋势。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartTimeMarketingDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
