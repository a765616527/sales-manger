"use client";

import { Check, ChevronsUpDown, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

type MarketingRecordItem = {
  id: number;
  date: string;
  addFriendsCount: number;
  conversionCount: number;
  createdAt: string;
  salesAccount: {
    id: number;
    promoter: string;
    wechatNickname: string;
    wechatId: string;
  };
  partTimeUser: {
    id: number;
    username: string;
    displayName: string | null;
  } | null;
};

type MarketingRecordsResponse = {
  message?: string;
  data?: {
    records: MarketingRecordItem[];
  };
};

function todayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateText(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateTimeText(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MarketingDataForm() {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [salesOpen, setSalesOpen] = useState(false);
  const [partTimeOpen, setPartTimeOpen] = useState(false);

  const [salesAccounts, setSalesAccounts] = useState<SalesAccountOption[]>([]);
  const [partTimeUsers, setPartTimeUsers] = useState<PartTimeOption[]>([]);
  const [records, setRecords] = useState<MarketingRecordItem[]>([]);

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

  async function fetchRecords() {
    setLoadingRecords(true);

    try {
      const response = await fetch("/api/marketing-data?limit=80", { method: "GET" });
      const result = (await response.json()) as MarketingRecordsResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "加载营销记录失败");
        return;
      }

      setRecords(result.data.records);
    } catch {
      toast.error("加载营销记录失败，请稍后重试");
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => {
    void fetchOptions();
    void fetchRecords();
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
      await fetchRecords();
    } catch {
      toast.error("营销数据添加失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRecord(record: MarketingRecordItem) {
    const confirmed = window.confirm(
      `确认删除该条营销记录？\n日期：${dateText(record.date)}\n销售微信：${record.salesAccount.wechatNickname}（${record.salesAccount.wechatId}）`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(record.id);

    try {
      const response = await fetch(`/api/marketing-data/${record.id}`, { method: "DELETE" });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "删除失败");
        return;
      }

      toast.success("营销记录删除成功");
      await fetchRecords();
    } catch {
      toast.error("删除失败，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
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
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={salesOpen}
                  className="h-auto min-h-10 w-full justify-between gap-2 py-2 text-left whitespace-normal"
                >
                  <span className="min-w-0 flex-1 break-all leading-5">
                    {selectedSales
                      ? `${selectedSales.wechatNickname}（${selectedSales.wechatId}）`
                      : loadingOptions
                        ? "加载中..."
                        : "请选择销售微信"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(92vw,420px)] max-w-[420px] p-0" align="start" sideOffset={8} collisionPadding={12}>
                <Command>
                  <CommandInput placeholder="搜索微信昵称或微信号" />
                  <CommandList className="max-h-[60svh]">
                    <CommandEmpty>未找到匹配销售微信</CommandEmpty>
                    <CommandGroup>
                      {salesAccounts.map((item) => (
                        <CommandItem
                          key={item.id}
                          className="items-start py-2"
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
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="break-all leading-5">{item.wechatNickname}</span>
                            <span className="break-all text-xs leading-5 text-muted-foreground">
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">已录入记录</h3>
            <p className="text-xs text-muted-foreground">展示最近 80 条营销记录，可直接删除。</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchRecords()} disabled={loadingRecords}>
            {loadingRecords ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            刷新
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">日期</TableHead>
                  <TableHead className="min-w-[230px]">销售微信</TableHead>
                  <TableHead className="w-[120px] text-right">添加好友</TableHead>
                  <TableHead className="w-[120px] text-right">转化人数</TableHead>
                  <TableHead className="min-w-[160px]">兼职人员</TableHead>
                  <TableHead className="w-[170px]">创建时间</TableHead>
                  <TableHead className="w-[110px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRecords ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        正在加载营销记录...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      暂无营销记录
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{dateText(record.date)}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="break-all font-medium">{record.salesAccount.wechatNickname}</div>
                          <div className="break-all text-xs text-muted-foreground">
                            {record.salesAccount.wechatId} | 发展人：{record.salesAccount.promoter}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{record.addFriendsCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{record.conversionCount.toLocaleString()}</TableCell>
                      <TableCell>
                        {record.partTimeUser ? (
                          <div className="space-y-0.5">
                            <div>{record.partTimeUser.displayName ?? record.partTimeUser.username}</div>
                            <div className="text-xs text-muted-foreground">{record.partTimeUser.username}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">未关联</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{dateTimeText(record.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteRecord(record)}
                          disabled={deletingId === record.id}
                        >
                          {deletingId === record.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              删除
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
