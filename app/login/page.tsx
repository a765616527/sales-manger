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
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />

      <Card className="w-full max-w-md border-white/40 bg-card/86">
        <CardHeader>
          <CardTitle className="text-2xl tracking-wide">销售管理系统</CardTitle>
          <CardDescription>统一登录入口，根据角色自动展示不同菜单</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-xs leading-6 text-muted-foreground">
            <p>请使用已分配账号登录。</p>
            <p>生产环境请妥善保管管理员账号与密码。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
