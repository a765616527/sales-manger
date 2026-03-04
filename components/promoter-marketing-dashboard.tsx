"use client";

import { Loader2, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const colorPalette = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#ef4444",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
];

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
    };
    series: SeriesItem[];
    accountChart: Array<Record<string, string | number>>;
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

export function PromoterMarketingDashboard() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"ACCOUNT" | "TOTAL">("ACCOUNT");

  const [startDate, setStartDate] = useState(daysAgoString(29));
  const [endDate, setEndDate] = useState(todayString());
  const [salesKeyword, setSalesKeyword] = useState("");

  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [accountChart, setAccountChart] = useState<Array<Record<string, string | number>>>([]);
  const [summary, setSummary] = useState({
    totalAddFriends: 0,
    totalConversions: 0,
    totalConversionRate: 0,
    dailyAddFriends: 0,
    dailyConversions: 0,
    dailyConversionRate: 0,
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
        color: "hsl(var(--chart-1))",
      },
    }),
    [],
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

        if (salesKeyword.trim()) {
          params.set("salesKeyword", salesKeyword.trim());
        }
      }

      const response = await fetch(`/api/promoter/marketing-dashboard?${params.toString()}`, {
        method: "GET",
      });

      const result = (await response.json()) as DashboardResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "加载营销看板失败");
        return;
      }

      setSeries(result.data.series);
      setAccountChart(result.data.accountChart);
      setSummary(result.data.summary);

      setStartDate(result.data.filters.startDate);
      setEndDate(result.data.filters.endDate);
      setSalesKeyword(result.data.filters.salesKeyword || "");
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
    setSalesKeyword("");
    setStartDate(daysAgoString(29));
    setEndDate(todayString());
    await fetchData({ reset: true });
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-12" onSubmit={handleSearch}>
        <div className="space-y-2 md:col-span-4">
          <Label>销售微信关键词</Label>
          <Input
            value={salesKeyword}
            onChange={(event) => setSalesKeyword(event.target.value)}
            placeholder="销售微信昵称或微信号"
          />
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总添加好友数</CardDescription>
            <CardTitle>{summary.totalAddFriends.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">当前筛选区间累计新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日添加好友数（结束日期）</CardDescription>
            <CardTitle>{summary.dailyAddFriends.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">结束日期当天新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总平均转化率</CardDescription>
            <CardTitle>{rateText(summary.totalConversionRate)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">总转化人数 / 总添加好友数</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>营销数据看板</CardTitle>
          <CardDescription>
            可查看自己名下销售账号每天添加好友趋势，支持按账号查看或查看全部账号总新增趋势。
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
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
