import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";
import { ROLE_HOME } from "@/lib/config/navigation";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect(ROLE_HOME[session.role]);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">销售管理系统</CardTitle>
          <CardDescription>统一登录入口，根据角色自动展示不同菜单</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <div className="rounded-md bg-muted p-3 text-xs leading-6 text-muted-foreground">
            <p>示例账号：</p>
            <p>管理员：admin / admin123456</p>
            <p>发展人：promoter_zhang / promoter123</p>
            <p>兼职：parttime_liu / parttime123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
