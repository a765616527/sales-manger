import { redirect } from "next/navigation";

import { SalesAccountForm } from "@/components/sales-account-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";

export default async function CreateSalesAccountPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>销售账号添加</CardTitle>
          <CardDescription>
            管理员可在此创建销售账号。创建日期默认为当天，销售微信号全局唯一，不允许重复。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
