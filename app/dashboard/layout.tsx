import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ROLE_LABEL } from "@/lib/auth/types";
import { getServerSession } from "@/lib/auth/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/72 px-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.8)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/58">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span className="text-sm text-muted-foreground">销售管理中台</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="border-primary/25 bg-primary/10 text-primary" variant="outline">
              {ROLE_LABEL[session.role]}
            </Badge>
            <span className="text-sm text-muted-foreground">{session.username}</span>
          </div>
        </header>

        <main className="min-h-[calc(100svh-56px)] bg-transparent p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
