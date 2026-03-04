import { redirect } from "next/navigation";

import { MarketingDataForm } from "@/components/marketing-data-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function MarketingDataCreatePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>营销数据添加</CardTitle>
          <CardDescription>
            录入每日营销数据：日期、销售微信、添加好友数量、转化人数、兼职人员。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarketingDataForm />
        </CardContent>
      </Card>
    </div>
  );
}
