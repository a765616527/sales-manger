"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SalesAccountOption = {
  id: number;
  promoter: string;
  wechatNickname: string;
  wechatId: string;
};

type PartTimeOption = {
  id: number;
  username: string;
  displayName: string | null;
};

type OptionsResponse = {
  message?: string;
  data?: {
    salesAccounts: SalesAccountOption[];
    partTimeUsers: PartTimeOption[];
  };
};

function todayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MarketingDataForm() {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [salesOpen, setSalesOpen] = useState(false);
  const [partTimeOpen, setPartTimeOpen] = useState(false);

  const [salesAccounts, setSalesAccounts] = useState<SalesAccountOption[]>([]);
  const [partTimeUsers, setPartTimeUsers] = useState<PartTimeOption[]>([]);

  const [date, setDate] = useState(todayString());
  const [salesAccountId, setSalesAccountId] = useState<number | null>(null);
  const [addFriendsCount, setAddFriendsCount] = useState<string>("");
  const [conversionCount, setConversionCount] = useState<string>("");
  const [partTimeUserId, setPartTimeUserId] = useState<number | null>(null);

  const selectedSales = useMemo(
    () => salesAccounts.find((item) => item.id === salesAccountId) ?? null,
    [salesAccounts, salesAccountId],
  );

  const selectedPartTime = useMemo(
    () => partTimeUsers.find((item) => item.id === partTimeUserId) ?? null,
    [partTimeUsers, partTimeUserId],
  );

  async function fetchOptions() {
    setLoadingOptions(true);

    try {
      const response = await fetch("/api/marketing-data/options", { method: "GET" });
      const result = (await response.json()) as OptionsResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "加载选项失败");
        return;
      }

      setSalesAccounts(result.data.salesAccounts);
      setPartTimeUsers(result.data.partTimeUsers);

      if (result.data.salesAccounts.length > 0 && salesAccountId === null) {
        setSalesAccountId(result.data.salesAccounts[0].id);
      }
    } catch {
      toast.error("加载选项失败，请稍后重试");
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    void fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setDate(todayString());
    setAddFriendsCount("");
    setConversionCount("");
    setPartTimeUserId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!salesAccountId) {
      toast.error("请选择销售微信");
      return;
    }

    const addFriends = Number(addFriendsCount);
    const conversion = Number(conversionCount);

    if (!Number.isInteger(addFriends) || addFriends < 0) {
      toast.error("添加好友数量必须是非负整数");
      return;
    }

    if (!Number.isInteger(conversion) || conversion < 0) {
      toast.error("转化人数必须是非负整数");
      return;
    }

    if (conversion > addFriends) {
      toast.error("转化人数不能大于添加好友数量");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/marketing-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          salesAccountId,
          addFriendsCount: addFriends,
          conversionCount: conversion,
          partTimeUserId,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "营销数据添加失败");
        return;
      }

      toast.success("营销数据添加成功");
      resetForm();
    } catch {
      toast.error("营销数据添加失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marketing-date">日期（默认当天）</Label>
          <Input id="marketing-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>销售微信选择（支持搜索）</Label>
          <Popover open={salesOpen} onOpenChange={setSalesOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={salesOpen} className="w-full justify-between">
                {selectedSales
                  ? `${selectedSales.wechatNickname}（${selectedSales.wechatId}）`
                  : loadingOptions
                    ? "加载中..."
                    : "请选择销售微信"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
              <Command>
                <CommandInput placeholder="搜索微信昵称或微信号" />
                <CommandList>
                  <CommandEmpty>未找到匹配销售微信</CommandEmpty>
                  <CommandGroup>
                    {salesAccounts.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.wechatNickname} ${item.wechatId} ${item.promoter}`}
                        onSelect={() => {
                          setSalesAccountId(item.id);
                          setSalesOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            salesAccountId === item.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{item.wechatNickname}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.wechatId} | 发展人：{item.promoter}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="add-friends-count">添加好友数量</Label>
          <Input
            id="add-friends-count"
            type="number"
            min={0}
            step={1}
            placeholder="请输入添加好友数量"
            value={addFriendsCount}
            onChange={(event) => setAddFriendsCount(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="conversion-count">转化人数</Label>
          <Input
            id="conversion-count"
            type="number"
            min={0}
            step={1}
            placeholder="请输入转化人数"
            value={conversionCount}
            onChange={(event) => setConversionCount(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>兼职人员</Label>
        <Popover open={partTimeOpen} onOpenChange={setPartTimeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={partTimeOpen} className="w-full justify-between">
              {selectedPartTime
                ? `${selectedPartTime.displayName ?? selectedPartTime.username}（${selectedPartTime.username}）`
                : "可选：请选择兼职人员"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="start">
            <Command>
              <CommandInput placeholder="搜索兼职姓名或账号" />
              <CommandList>
                <CommandEmpty>未找到匹配兼职人员</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="不选择兼职人员"
                    onSelect={() => {
                      setPartTimeUserId(null);
                      setPartTimeOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", partTimeUserId === null ? "opacity-100" : "opacity-0")} />
                    不选择兼职人员
                  </CommandItem>

                  {partTimeUsers.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.displayName ?? ""} ${item.username}`}
                      onSelect={() => {
                        setPartTimeUserId(item.id);
                        setPartTimeOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          partTimeUserId === item.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{item.displayName ?? item.username}</span>
                        <span className="text-xs text-muted-foreground">{item.username}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving || loadingOptions}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              提交中...
            </>
          ) : (
            "保存营销数据"
          )}
        </Button>

        <Button type="button" variant="outline" onClick={() => resetForm()} disabled={saving}>
          重置
        </Button>
      </div>
    </form>
  );
}
