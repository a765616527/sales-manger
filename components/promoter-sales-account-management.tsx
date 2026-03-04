"use client";

import { Loader2, PencilLine, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SalesAccountItem = {
  id: number;
  createdAt: string;
  promoter: string;
  wechatNickname: string;
  wechatId: string;
  remark: string | null;
  isEnabled: boolean;
};

type SalesAccountListResponse = {
  message?: string;
  data?: {
    accounts: SalesAccountItem[];
  };
};

const STATUS_ALL = "ALL";

type RowActionsProps = {
  account: SalesAccountItem;
  onUpdated: () => Promise<void>;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
}

function SalesAccountRowActions({ account, onUpdated }: RowActionsProps) {
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkValue, setRemarkValue] = useState(account.remark ?? "");
  const [savingRemark, setSavingRemark] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    setRemarkValue(account.remark ?? "");
  }, [account.remark]);

  async function handleSaveRemark() {
    setSavingRemark(true);

    try {
      const response = await fetch(`/api/promoter/sales-accounts/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remark: remarkValue,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "备注更新失败");
        return;
      }

      toast.success("备注更新成功");
      setRemarkOpen(false);
      await onUpdated();
    } catch {
      toast.error("备注更新失败，请稍后重试");
    } finally {
      setSavingRemark(false);
    }
  }

  async function handleToggleStatus() {
    setTogglingStatus(true);

    try {
      const response = await fetch(`/api/promoter/sales-accounts/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isEnabled: !account.isEnabled,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "状态更新失败");
        return;
      }

      toast.success(account.isEnabled ? "已停用该账号" : "已启用该账号");
      await onUpdated();
    } catch {
      toast.error("状态更新失败，请稍后重试");
    } finally {
      setTogglingStatus(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Dialog open={remarkOpen} onOpenChange={setRemarkOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <PencilLine className="h-4 w-4" />
            编辑备注
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑备注</DialogTitle>
            <DialogDescription>请填写或修改该销售账号备注信息。</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            maxLength={500}
            placeholder="请输入备注（最多 500 字）"
            value={remarkValue}
            onChange={(event) => setRemarkValue(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRemark} disabled={savingRemark}>
              {savingRemark ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant={account.isEnabled ? "destructive" : "default"} size="sm" onClick={handleToggleStatus} disabled={togglingStatus}>
        {togglingStatus ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : account.isEnabled ? (
          "停用"
        ) : (
          "启用"
        )}
      </Button>
    </div>
  );
}

export function PromoterSalesAccountManagement() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState(STATUS_ALL);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SalesAccountItem[]>([]);

  async function fetchAccounts() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      if (status !== STATUS_ALL) {
        params.set("status", status);
      }

      const queryString = params.toString();
      const response = await fetch(`/api/promoter/sales-accounts${queryString ? `?${queryString}` : ""}`, {
        method: "GET",
      });

      const result = (await response.json()) as SalesAccountListResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "获取销售账号列表失败");
        return;
      }

      setAccounts(result.data.accounts);
    } catch {
      toast.error("获取销售账号列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchAccounts();
  }

  async function handleReset() {
    setKeyword("");
    setStatus(STATUS_ALL);

    setLoading(true);

    try {
      const response = await fetch("/api/promoter/sales-accounts", { method: "GET" });
      const result = (await response.json()) as SalesAccountListResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "重置后加载失败");
        return;
      }

      setAccounts(result.data.accounts);
    } catch {
      toast.error("重置后加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-12" onSubmit={handleSearch}>
        <div className="md:col-span-6">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入微信昵称或微信号关键词"
          />
        </div>

        <div className="md:col-span-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="按状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部状态</SelectItem>
              <SelectItem value="ENABLED">启用中</SelectItem>
              <SelectItem value="DISABLED">已停用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 md:col-span-3 md:justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "查询"}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            重置
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">创建日期</TableHead>
              <TableHead className="w-[180px]">销售微信号昵称</TableHead>
              <TableHead className="w-[180px]">销售微信号</TableHead>
              <TableHead className="min-w-[220px]">备注</TableHead>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead className="w-[220px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在加载数据...
                  </span>
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  暂无符合条件的销售账号
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{formatDate(account.createdAt)}</TableCell>
                  <TableCell>{account.wechatNickname}</TableCell>
                  <TableCell>{account.wechatId}</TableCell>
                  <TableCell className="max-w-[240px] truncate" title={account.remark ?? ""}>
                    {account.remark?.trim() ? account.remark : "-"}
                  </TableCell>
                  <TableCell>
                    {account.isEnabled ? <Badge>启用中</Badge> : <Badge variant="secondary">已停用</Badge>}
                  </TableCell>
                  <TableCell>
                    <SalesAccountRowActions account={account} onUpdated={fetchAccounts} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
