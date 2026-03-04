import { z } from "zod";

import { APP_ROLES } from "@/lib/auth/types";

export const userCreateSchema = z.object({
  username: z
    .string()
    .min(3, "账号至少 3 位")
    .max(32, "账号最多 32 位")
    .regex(/^[a-zA-Z0-9_]+$/, "账号仅支持字母、数字和下划线"),
  password: z.string().min(6, "密码至少 6 位").max(64, "密码最多 64 位"),
  displayName: z.string().min(1, "请输入姓名").max(50, "姓名最多 50 字"),
  role: z.enum(APP_ROLES, {
    message: "角色无效",
  }),
});

export const userUpdateSchema = z
  .object({
    displayName: z.string().min(1, "请输入姓名").max(50, "姓名最多 50 字").optional(),
    role: z.enum(APP_ROLES, { message: "角色无效" }).optional(),
    isEnabled: z.boolean().optional(),
    resetPassword: z.string().min(6, "重置密码至少 6 位").max(64, "重置密码最多 64 位").optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "至少更新一个字段",
  });

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
