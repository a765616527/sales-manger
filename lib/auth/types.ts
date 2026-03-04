export const APP_ROLES = ["ADMIN", "PROMOTER", "PART_TIME"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type SessionUser = {
  userId: number;
  username: string;
  role: AppRole;
};

export const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: "管理员",
  PROMOTER: "发展人",
  PART_TIME: "兼职",
};

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}
