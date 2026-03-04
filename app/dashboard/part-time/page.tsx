import { redirect } from "next/navigation";

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
    <Card>
      <CardHeader>
        <CardTitle>兼职工作台</CardTitle>
        <CardDescription>当前是兼职角色占位页，后续可扩展每日任务、数据录入、跟进反馈等模块。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">请选择下一步要构建的兼职端页面。</CardContent>
    </Card>
  );
}
