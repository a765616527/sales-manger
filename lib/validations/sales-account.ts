import { z } from "zod";

export const salesAccountSchema = z.object({
  promoter: z.string().min(1, "请输入发展人"),
  promoterUserId: z.number().int().positive("发展人参数不正确").optional(),
  wechatNickname: z.string().min(1, "请输入销售微信号昵称"),
  wechatId: z
    .string()
    .min(1, "请输入销售微信号")
    .max(64, "销售微信号长度不能超过 64")
    .regex(/^[A-Za-z][-_A-Za-z0-9]{5,63}$/, "销售微信号格式不正确"),
  remark: z.string().max(500, "备注最多 500 字").optional(),
});

export type SalesAccountInput = z.infer<typeof salesAccountSchema>;
