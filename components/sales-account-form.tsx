"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SalesAccountInput } from "@/lib/validations/sales-account";
import { salesAccountSchema } from "@/lib/validations/sales-account";

function todayString() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function SalesAccountForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<SalesAccountInput>({
    resolver: zodResolver(salesAccountSchema),
    defaultValues: {
      promoter: "",
      wechatNickname: "",
      wechatId: "",
      remark: "",
    },
  });

  async function onSubmit(values: SalesAccountInput) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/sales-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "提交失败");
        return;
      }

      toast.success("销售账号创建成功");
      form.reset({
        promoter: "",
        wechatNickname: "",
        wechatId: "",
        remark: "",
      });
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <FormItem>
          <FormLabel>创建日期</FormLabel>
          <FormControl>
            <Input value={todayString()} disabled readOnly />
          </FormControl>
          <FormDescription>默认当天创建，不可修改。</FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="promoter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>发展人</FormLabel>
              <FormControl>
                <Input placeholder="请输入发展人姓名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="wechatNickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>销售微信号昵称</FormLabel>
              <FormControl>
                <Input placeholder="请输入销售微信昵称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="wechatId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>销售微信号</FormLabel>
              <FormControl>
                <Input placeholder="请输入销售微信号（全局唯一）" {...field} />
              </FormControl>
              <FormDescription>该字段唯一，重复将被阻止。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>备注</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="选填，补充说明信息" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              提交中...
            </>
          ) : (
            "保存销售账号"
          )}
        </Button>
      </form>
    </Form>
  );
}
