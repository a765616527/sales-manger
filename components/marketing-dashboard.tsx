"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ALL_PROMOTER = "__ALL_PROMOTER__";
const ALL_PART_TIME = "__ALL_PART_TIME__";

type SeriesItem = {
  key: string;
  label: string;
  promoter: string;
  wechatNickname: string;
  wechatId: string;
};

type DashboardResponse = {
  message?: string;
  data?: {
    filters: {
      startDate: string;
      endDate: string;
      promoter: string;
      salesKeyword: string;
      partTimeUserId: number | null;
    };
    promoterOptions: string[];
    partTimeOptions: Array<{
      id: number;
      username: string;
      displayName: string | null;
    }>;
    series: SeriesItem[];
    addFriendsChart: Array<Record<string, string | number>>;
    conversionChart: Array<Record<string, string | number>>;
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
  "#ec4899",
];

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
  const [chartView, setChartView] = useState<"ADD_FRIENDS" | "CONVERSION">("ADD_FRIENDS");

  const [startDate, setStartDate] = useState(daysAgoString(29));
  const [endDate, setEndDate] = useState(todayString());
  const [promoter, setPromoter] = useState(ALL_PROMOTER);
  const [salesKeyword, setSalesKeyword] = useState("");
  const [partTimeUserId, setPartTimeUserId] = useState(ALL_PART_TIME);

  const [promoterOptions, setPromoterOptions] = useState<string[]>([]);
  const [partTimeOptions, setPartTimeOptions] = useState<Array<{ id: number; username: string; displayName: string | null }>>([]);

  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [addFriendsChart, setAddFriendsChart] = useState<Array<Record<string, string | number>>>([]);
  const [conversionChart, setConversionChart] = useState<Array<Record<string, string | number>>>([]);
  const [summary, setSummary] = useState({
    totalAddFriends: 0,
    totalConversions: 0,
    totalConversionRate: 0,
    dailyAddFriends: 0,
    dailyConversions: 0,
    dailyConversionRate: 0,
  });

  const chartConfig = useMemo(() => {
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

        if (salesKeyword.trim()) {
          params.set("salesKeyword", salesKeyword.trim());
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
      setPartTimeOptions(result.data.partTimeOptions);
      setSeries(result.data.series);
      setAddFriendsChart(result.data.addFriendsChart);
      setConversionChart(result.data.conversionChart);
      setSummary(result.data.summary);

      setStartDate(result.data.filters.startDate);
      setEndDate(result.data.filters.endDate);
      setPromoter(result.data.filters.promoter || ALL_PROMOTER);
      setSalesKeyword(result.data.filters.salesKeyword || "");
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
    setSalesKeyword("");
    setPartTimeUserId(ALL_PART_TIME);
    setStartDate(daysAgoString(29));
    setEndDate(todayString());
    await fetchData({ reset: true });
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-12" onSubmit={handleSearch}>
        <div className="space-y-2 md:col-span-2">
          <Label>发展人</Label>
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

        <div className="space-y-2 md:col-span-3">
          <Label>销售微信关键词</Label>
          <Input
            value={salesKeyword}
            onChange={(event) => setSalesKeyword(event.target.value)}
            placeholder="微信昵称或微信号"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>兼职人员</Label>
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

        <div className="space-y-2 md:col-span-2">
          <Label>开始日期</Label>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>结束日期</Label>
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>

        <div className="flex items-end gap-2 md:col-span-1">
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
            <div className="text-xs text-muted-foreground">统计区间累计新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总转化人数</CardDescription>
            <CardTitle>{summary.totalConversions.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">统计区间累计转化人数</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总平均转化率</CardDescription>
            <CardTitle>{rateText(summary.totalConversionRate)}</CardTitle>
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
            <CardTitle>{summary.dailyAddFriends.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">当前查询结束日期当天新增好友</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日转化人数（结束日期）</CardDescription>
            <CardTitle>{summary.dailyConversions.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">当前查询结束日期当天转化人数</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>日平均转化率（结束日期）</CardDescription>
            <CardTitle>{rateText(summary.dailyConversionRate)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">计算方式：日转化人数 / 日添加好友数</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle>营销趋势折线图</CardTitle>
            <CardDescription>
              支持查看各发展人下销售账号每日添加好友与每日转化趋势。
              <Badge className="ml-2" variant="secondary">
                共 {series.length} 个销售账号
              </Badge>
            </CardDescription>
          </div>
          <Tabs value={chartView} onValueChange={(value) => setChartView(value as "ADD_FRIENDS" | "CONVERSION")}>
            <TabsList>
              <TabsTrigger value="ADD_FRIENDS">每日添加好友数量</TabsTrigger>
              <TabsTrigger value="CONVERSION">每日转化人数</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">当前筛选条件下暂无数据</div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[380px] w-full">
              <LineChart data={chartView === "ADD_FRIENDS" ? addFriendsChart : conversionChart}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
