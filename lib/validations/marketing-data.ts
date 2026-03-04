import { z } from "zod";

export const marketingDataCreateSchema = z
  .object({
    date: z.string().min(1, "请选择日期"),
    salesAccountId: z.number().int().positive("请选择销售微信"),
    addFriendsCount: z.number().int().min(0, "添加好友数量不能小于 0"),
    conversionCount: z.number().int().min(0, "转化人数不能小于 0"),
    partTimeUserId: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => data.conversionCount <= data.addFriendsCount, {
    message: "转化人数不能大于添加好友数量",
    path: ["conversionCount"],
  });

export type MarketingDataCreateInput = z.infer<typeof marketingDataCreateSchema>;
