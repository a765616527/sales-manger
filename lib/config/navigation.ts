import type { AppRole } from "@/lib/auth/types";

export type NavItem = {
  title: string;
  href: string;
  icon:
    | "layout-dashboard"
    | "user-plus"
    | "line-chart"
    | "contact"
    | "list"
    | "bar-chart-3"
    | "users";
};

export const ROLE_NAVIGATION: Record<AppRole, NavItem[]> = {
  ADMIN: [
    {
      title: "销售账号管理",
      href: "/dashboard/admin/sales-accounts",
      icon: "list",
    },
    {
      title: "销售账号添加",
      href: "/dashboard/admin/sales-accounts/new",
      icon: "user-plus",
    },
    {
      title: "营销数据添加",
      href: "/dashboard/admin/marketing-data/new",
      icon: "layout-dashboard",
    },
    {
      title: "营销数据看板",
      href: "/dashboard/admin/marketing-dashboard",
      icon: "bar-chart-3",
    },
    {
      title: "用户管理",
      href: "/dashboard/admin/users",
      icon: "users",
    },
  ],
  PROMOTER: [
    {
      title: "我的销售账号",
      href: "/dashboard/promoter/sales-accounts",
      icon: "list",
    },
    {
      title: "我的营销看板",
      href: "/dashboard/promoter/marketing-dashboard",
      icon: "bar-chart-3",
    },
  ],
  PART_TIME: [
    {
      title: "我的营销看板",
      href: "/dashboard/part-time",
      icon: "bar-chart-3",
    },
  ],
};

export const ROLE_HOME: Record<AppRole, string> = {
  ADMIN: "/dashboard/admin/sales-accounts",
  PROMOTER: "/dashboard/promoter/sales-accounts",
  PART_TIME: "/dashboard/part-time",
};
