"use client";

import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_PROMOTER = "__ALL_PROMOTER__";
const ALL_SALES_ACCOUNT = "__ALL_SALES_ACCOUNT__";
const ALL_PART_TIME = "__ALL_PART_TIME__";

type DashboardResponse = {
  message?: string;
  data?: {
    filters: {
      startDate: string;
      endDate: string;
      promoter: string;
      salesKeyword: string;
      salesAccountId: number | null;
      partTimeUserId: number | null;
    };
    promoterOptions: string[];
    salesAccountOptions: Array<{
      id: number;
      promoter: string;
      wechatNickname: string;
      wechatId: string;
    }>;
    partTimeOptions: Array<{
      id: number;
      username: string;
      displayName: string | null;
    }>;
    trendChart: Array<{
      date: string;
      addFriends: number;
      conversions: number;
    }>;
    summary: {
      totalAddFriends: number;
      totalConversions: number;
      totalConversionRate: number;
      dailyAddFriends: number;
      dailyConversions: number;
      dailyConversionRate: number;
    };
  };
};

const trendChartConfig: ChartConfig = {
  addFriends: {
    label: "每日添加好友量",
    color: "var(--chart-1)",
  },
  conversions: {
    label: "每日转化人数",
    color: "var(--chart-4)",
  },
};

function todayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgoString(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rateText(rate: number) {
  return `${(rate * 100).toFixed(2)}%`;
}

function shortDateLabel(date: string) {
  if (date.length !== 10) {
    return date;
  }

  return `${date.slice(5, 7)}-${date.slice(8, 10)}`;
}

export function MarketingDashboard() {
  const [loading, setLoading] = useState(true);
  const [salesSelectorOpen, setSalesSelectorOpen] = useState(false);

  const [startDate, setStartDate] = useState(daysAgoString(29));
  const [endDate, setEndDate] = useState(todayString());
  const [promoter, setPromoter] = useState(ALL_PROMOTER);
  const [salesAccountId, setSalesAccountId] = useState(ALL_SALES_ACCOUNT);
  const [partTimeUserId, setPartTimeUserId] = useState(ALL_PART_TIME);

  const [promoterOptions, setPromoterOptions] = useState<string[]>([]);
  const [salesAccountOptions, setSalesAccountOptions] = useState<
    Array<{ id: number; promoter: string; wechatNickname: string; wechatId: string }>
  >([]);
  const [partTimeOptions, setPartTimeOptions] = useState<Array<{ id: number; username: string; displayName: string | null }>>([]);

  const [trendChart, setTrendChart] = useState<Array<{ date: string; addFriends: number; conversions: number }>>([]);
  const [summary, setSummary] = useState({
    totalAddFriends: 0,
    totalConversions: 0,
    totalConversionRate: 0,
    dailyAddFriends: 0,
    dailyConversions: 0,
    dailyConversionRate: 0,
  });

  const selectedSalesAccount = useMemo(
    () => salesAccountOptions.find((item) => String(item.id) === salesAccountId) ?? null,
    [salesAccountId, salesAccountOptions],
  );

  async function fetchData(options?: { reset?: boolean }) {
    const shouldReset = options?.reset ?? false;
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (shouldReset) {
        params.set("startDate", daysAgoString(29));
        params.set("endDate", todayString());
      } else {
        params.set("startDate", startDate);
        params.set("endDate", endDate);

        if (promoter !== ALL_PROMOTER) {
          params.set("promoter", promoter);
        }

        if (salesAccountId !== ALL_SALES_ACCOUNT) {
          params.set("salesAccountId", salesAccountId);
        }

        if (partTimeUserId !== ALL_PART_TIME) {
          params.set("partTimeUserId", partTimeUserId);
        }
      }

      const response = await fetch(`/api/marketing-data/dashboard?${params.toString()}`, {
        method: "GET",
      });

      const result = (await response.json()) as DashboardResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "加载营销看板失败");
        return;
      }

      setPromoterOptions(result.data.promoterOptions);
      setSalesAccountOptions(result.data.salesAccountOptions);
      setPartTimeOptions(result.data.partTimeOptions);
      setTrendChart(result.data.trendChart);
      setSummary(result.data.summary);

      setStartDate(result.data.filters.startDate);
      setEndDate(result.data.filters.endDate);
      setPromoter(result.data.filters.promoter || ALL_PROMOTER);
      setSalesAccountId(
        result.data.filters.salesAccountId !== null ? String(result.data.filters.salesAccountId) : ALL_SALES_ACCOUNT,
      );
      setPartTimeUserId(
        result.data.filters.partTimeUserId !== null ? String(result.data.filters.partTimeUserId) : ALL_PART_TIME,
      );
    } catch {
      toast.error("加载营销看板失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchData();
  }

  async function handleReset() {
    setPromoter(ALL_PROMOTER);
    setSalesAccountId(ALL_SALES_ACCOUNT);
    setPartTimeUserId(ALL_PART_TIME);
    setStartDate(daysAgoString(29));
    setEndDate(todayString());
    await fetchData({ reset: true });
  }

  const hasTrendData = trendChart.some((item) => item.addFriends > 0 || item.conversions > 0);

  return (
    <div className="space-y-4">
      <form className="space-y-3 rounded-xl border border-border/70 bg-card/75 p-3.5 md:p-4" onSubmit={handleSearch}>
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="space-y-1.5 lg:w-36 lg:shrink-0">
            <Label className="text-xs text-muted-foreground">发展人</Label>
            <Select value={promoter} onValueChange={setPromoter}>
              <SelectTrigger>
                <SelectValue placeholder="全部发展人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PROMOTER}>全部发展人</SelectItem>
                {promoterOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 lg:w-[23rem] lg:shrink-0">
            <Label className="text-xs text-muted-foreground">销售微信（支持搜索）</Label>
            <Popover open={salesSelectorOpen} onOpenChange={setSalesSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={salesSelectorOpen}
                  className="h-auto min-h-10 w-full justify-between gap-2 py-2 text-left whitespace-normal"
                >
                  <span className="min-w-0 flex-1 break-all leading-5">
                    {selectedSalesAccount
                      ? `${selectedSalesAccount.wechatNickname}（${selectedSalesAccount.wechatId}）`
                      : "全部销售微信"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(92vw,420px)] max-w-[420px] p-0"
                align="start"
                sideOffset={8}
                collisionPadding={12}
              >
                <Command>
                  <CommandInput placeholder="搜索微信昵称或微信号" />
                  <CommandList className="max-h-[60svh]">
                    <CommandEmpty>未找到匹配销售微信</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="全部销售微信"
                        onSelect={() => {
                          setSalesAccountId(ALL_SALES_ACCOUNT);
                          setSalesSelectorOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            salesAccountId === ALL_SALES_ACCOUNT ? "opacity-100" : "opacity-0",
                          )}
                        />
                        全部销售微信
                      </CommandItem>

                      {salesAccountOptions.map((item) => (
                        <CommandItem
                          key={item.id}
                          className="items-start py-2"
                          value={`${item.wechatNickname} ${item.wechatId} ${item.promoter}`}
                          onSelect={() => {
                            setSalesAccountId(String(item.id));
                            setSalesSelectorOpen(false);
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", salesAccountId === String(item.id) ? "opacity-100" : "opacity-0")}
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

          <div className="space-y-1.5 lg:w-44 lg:shrink-0">
            <Label className="text-xs text-muted-foreground">兼职人员</Label>
            <Select value={partTimeUserId} onValueChange={setPartTimeUserId}>
              <SelectTrigger>
                <SelectValue placeholder="全部兼职" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PART_TIME}>全部兼职</SelectItem>
                {partTimeOptions.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.displayName ?? item.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[20rem] lg:shrink-0">
            <div className="space-y-1.5 lg:w-42">
              <Label className="text-xs text-muted-foreground">开始日期</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-1.5 lg:w-42">
              <Label className="text-xs text-muted-foreground">结束日期</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border/60 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">筛选后可直接对比每日添加好友量与转化人数趋势。</div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
              重置条件
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              查询
            </Button>
          </div>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总添加好友数</CardDescription>
            <CardTitle className="text-3xl font-medium tracking-tight text-sky-700 md:text-4xl dark:text-sky-300">
              {summary.totalAddFriends.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">统计区间累计新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总转化人数</CardDescription>
            <CardTitle className="text-3xl font-medium tracking-tight text-emerald-700 md:text-4xl dark:text-emerald-300">
              {summary.totalConversions.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">统计区间累计转化人数</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总平均转化率</CardDescription>
            <CardTitle className="text-3xl font-medium tracking-tight text-violet-700 md:text-4xl dark:text-violet-300">
              {rateText(summary.totalConversionRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">计算方式：总转化人数 / 总添加好友数</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日添加好友数（结束日期）</CardDescription>
            <CardTitle className="text-3xl font-medium tracking-tight text-cyan-700 md:text-4xl dark:text-cyan-300">
              {summary.dailyAddFriends.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">当前查询结束日期当天新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日转化人数（结束日期）</CardDescription>
            <CardTitle className="text-3xl font-medium tracking-tight text-teal-700 md:text-4xl dark:text-teal-300">
              {summary.dailyConversions.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">当前查询结束日期当天转化人数</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日平均转化率（结束日期）</CardDescription>
            <CardTitle className="text-3xl font-medium tracking-tight text-indigo-700 md:text-4xl dark:text-indigo-300">
              {rateText(summary.dailyConversionRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">计算方式：日转化人数 / 日添加好友数</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>营销趋势折线图</CardTitle>
            <CardDescription>每日添加好友量与每日转化人数同图展示，使用双线对比趋势。</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!hasTrendData ? (
            <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">当前筛选条件下暂无数据</div>
          ) : (
            <ChartContainer config={trendChartConfig} className="h-[380px] w-full">
              <LineChart data={trendChart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDateLabel} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="addFriends" stroke="var(--color-addFriends)" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="var(--color-conversions)" strokeWidth={2.4} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
