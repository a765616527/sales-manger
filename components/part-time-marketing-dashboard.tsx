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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const colorPalette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#ef4444",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
];

const ALL_SALES_ACCOUNT = "__ALL_SALES_ACCOUNT__";

type SeriesItem = {
  key: string;
  label: string;
  wechatNickname: string;
  wechatId: string;
};

type DashboardResponse = {
  message?: string;
  data?: {
    filters: {
      startDate: string;
      endDate: string;
      salesKeyword: string;
      salesAccountId: number | null;
    };
    salesAccountOptions: Array<{
      id: number;
      wechatNickname: string;
      wechatId: string;
    }>;
    series: SeriesItem[];
    accountChart: Array<Record<string, string | number>>;
    summary: {
      totalAddFriends: number;
      dailyAddFriends: number;
      activeSalesAccountCount: number;
      recordCount: number;
      averageDailyAddFriends: number;
    };
  };
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

function shortDateLabel(date: string) {
  if (date.length !== 10) {
    return date;
  }

  return `${date.slice(5, 7)}-${date.slice(8, 10)}`;
}

function numberText(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

export function PartTimeMarketingDashboard() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"ACCOUNT" | "TOTAL">("ACCOUNT");
  const [salesSelectorOpen, setSalesSelectorOpen] = useState(false);

  const [startDate, setStartDate] = useState(daysAgoString(29));
  const [endDate, setEndDate] = useState(todayString());
  const [salesAccountId, setSalesAccountId] = useState(ALL_SALES_ACCOUNT);

  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [salesAccountOptions, setSalesAccountOptions] = useState<
    Array<{ id: number; wechatNickname: string; wechatId: string }>
  >([]);
  const [accountChart, setAccountChart] = useState<Array<Record<string, string | number>>>([]);
  const [summary, setSummary] = useState({
    totalAddFriends: 0,
    dailyAddFriends: 0,
    activeSalesAccountCount: 0,
    recordCount: 0,
    averageDailyAddFriends: 0,
  });

  const accountChartConfig = useMemo(() => {
    const config: ChartConfig = {};

    for (let i = 0; i < series.length; i += 1) {
      const item = series[i];
      config[item.key] = {
        label: item.label,
        color: colorPalette[i % colorPalette.length],
      };
    }

    return config;
  }, [series]);

  const totalChartConfig = useMemo<ChartConfig>(
    () => ({
      total: {
        label: "全部销售账号总新增",
        color: "var(--chart-1)",
      },
    }),
    [],
  );

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

        if (salesAccountId !== ALL_SALES_ACCOUNT) {
          params.set("salesAccountId", salesAccountId);
        }
      }

      const response = await fetch(`/api/part-time/marketing-dashboard?${params.toString()}`, {
        method: "GET",
      });

      const result = (await response.json()) as DashboardResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "加载营销看板失败");
        return;
      }

      setSeries(result.data.series);
      setSalesAccountOptions(result.data.salesAccountOptions);
      setAccountChart(result.data.accountChart);
      setSummary(result.data.summary);

      setStartDate(result.data.filters.startDate);
      setEndDate(result.data.filters.endDate);
      setSalesAccountId(
        result.data.filters.salesAccountId !== null ? String(result.data.filters.salesAccountId) : ALL_SALES_ACCOUNT,
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
    setSalesAccountId(ALL_SALES_ACCOUNT);
    setStartDate(daysAgoString(29));
    setEndDate(todayString());
    await fetchData({ reset: true });
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-12" onSubmit={handleSearch}>
        <div className="space-y-2 md:col-span-4">
          <Label>销售微信（支持搜索）</Label>
          <Popover open={salesSelectorOpen} onOpenChange={setSalesSelectorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={salesSelectorOpen}
                className="h-auto min-h-10 w-full justify-between gap-2 py-2 text-left whitespace-normal"
              >
                <span className="min-w-0 flex-1 break-all leading-5">
                  {selectedSalesAccount ? selectedSalesAccount.wechatId : "全部销售微信"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(92vw,420px)] max-w-[420px] p-0" align="start" sideOffset={8} collisionPadding={12}>
              <Command>
                <CommandInput placeholder="搜索微信号" />
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
                        value={`${item.wechatId} ${item.wechatNickname}`}
                        onSelect={() => {
                          setSalesAccountId(String(item.id));
                          setSalesSelectorOpen(false);
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", salesAccountId === String(item.id) ? "opacity-100" : "opacity-0")}
                        />
                        <span className="min-w-0 flex-1 break-all leading-5">{item.wechatId}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label>开始日期</Label>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label>结束日期</Label>
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>

        <div className="flex items-end gap-2 md:col-span-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-end gap-2 md:col-span-12 md:justify-end">
          <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
            重置条件
          </Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总添加好友数</CardDescription>
            <CardTitle className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              {summary.totalAddFriends.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">当前筛选区间累计新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日添加好友数（结束日期）</CardDescription>
            <CardTitle className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              {summary.dailyAddFriends.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">结束日期当天新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>涉及销售账号数</CardDescription>
            <CardTitle className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              {summary.activeSalesAccountCount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">当前筛选区间内有数据的销售账号数量</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日均新增（区间）</CardDescription>
            <CardTitle className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              {numberText(summary.averageDailyAddFriends)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">按筛选区间自然日平均新增好友</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>我的营销数据看板</CardTitle>
          <CardDescription>
            仅统计你负责的营销记录（兼职人员=本人），支持按销售微信查看各账号日新增，或查看全部账号总新增趋势。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as "ACCOUNT" | "TOTAL")}>
            <TabsList>
              <TabsTrigger value="ACCOUNT">按销售账号</TabsTrigger>
              <TabsTrigger value="TOTAL">全部账号总新增</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "ACCOUNT" ? (
            series.length === 0 ? (
              <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">当前筛选条件下暂无数据</div>
            ) : (
              <ChartContainer config={accountChartConfig} className="h-[380px] w-full">
                <LineChart data={accountChart}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDateLabel} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {series.map((item) => (
                    <Line
                      key={item.key}
                      type="monotone"
                      dataKey={item.key}
                      stroke={`var(--color-${item.key})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            )
          ) : (
            <ChartContainer config={totalChartConfig} className="h-[380px] w-full">
              <LineChart data={accountChart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDateLabel} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2.2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">记录条数：{summary.recordCount.toLocaleString()}</div>
    </div>
  );
}
