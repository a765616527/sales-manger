"use client";

import { BarChart3, ContactRound, LayoutDashboard, LineChart, List, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ROLE_LABEL, type SessionUser } from "@/lib/auth/types";
import { ROLE_NAVIGATION } from "@/lib/config/navigation";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "user-plus": UserPlus,
  "line-chart": LineChart,
  contact: ContactRound,
  list: List,
  "bar-chart-3": BarChart3,
  users: Users,
};

type AppSidebarProps = {
  user: SessionUser;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const menus = ROLE_NAVIGATION[user.role];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-1">
        <div className="px-2 py-1 text-sm font-semibold">销售管理系统</div>
        <div className="px-2 text-xs text-muted-foreground">角色权限中台</div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>功能菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menus.map((menu) => {
                const Icon = iconMap[menu.icon];
                const isActive = pathname === menu.href || pathname.startsWith(`${menu.href}/`);

                return (
                  <SidebarMenuItem key={menu.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={menu.title}>
                      <Link href={menu.href}>
                        <Icon />
                        <span>{menu.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-3">
        <div className="flex items-center justify-between gap-2 rounded-md border p-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user.username}</div>
            <div className="text-xs text-muted-foreground">当前用户</div>
          </div>
          <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
        </div>
        <LogoutButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
