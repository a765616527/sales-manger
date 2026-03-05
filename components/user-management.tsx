"use client";

import { Loader2, Plus, Save, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { APP_ROLES, ROLE_LABEL, type AppRole } from "@/lib/auth/types";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_ALL = "ALL";
const STATUS_ALL = "ALL";

type UserItem = {
  id: number;
  username: string;
  displayName: string | null;
  role: AppRole;
  isEnabled: boolean;
  createdAt: string;
};

type UsersResponse = {
  message?: string;
  data?: UserItem[];
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
}

function CreateUserDialog({ onCreated }: { onCreated: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AppRole>("PROMOTER");

  function resetForm() {
    setUsername("");
    setPassword("");
    setDisplayName("");
    setRole("PROMOTER");
  }

  async function handleCreate() {
    if (!username || !password || !displayName) {
      toast.error("请完整填写账号、密码、姓名");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          displayName,
          role,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "创建用户失败");
        return;
      }

      toast.success("用户创建成功");
      setOpen(false);
      resetForm();
      await onCreated();
    } catch {
      toast.error("创建用户失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          新增用户
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增用户</DialogTitle>
          <DialogDescription>可创建管理员、发展人、兼职用户。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-username">账号</Label>
            <Input id="create-username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password">密码</Label>
            <Input
              id="create-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-display-name">姓名</Label>
            <Input
              id="create-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>角色</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                {APP_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROLE_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserEditDialog({
  user,
  onUpdated,
  isCurrentUser,
}: {
  user: UserItem;
  onUpdated: () => Promise<void>;
  isCurrentUser: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [role, setRole] = useState<AppRole>(user.role);
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    setDisplayName(user.displayName ?? "");
    setRole(user.role);
    setResetPassword("");
  }, [user]);

  async function handleSave() {
    if (!displayName.trim()) {
      toast.error("姓名不能为空");
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        displayName: displayName.trim(),
      };

      if (!isCurrentUser) {
        body.role = role;
      }

      if (resetPassword.trim()) {
        body.resetPassword = resetPassword;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "更新用户失败");
        return;
      }

      toast.success("用户信息更新成功");
      setOpen(false);
      await onUpdated();
    } catch {
      toast.error("更新用户失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          编辑
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>可修改姓名、角色，或重置密码。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>账号</Label>
            <Input value={user.username} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-display-${user.id}`}>姓名</Label>
            <Input
              id={`edit-display-${user.id}`}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>角色</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)} disabled={isCurrentUser}>
              <SelectTrigger>
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                {APP_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROLE_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCurrentUser ? (
              <p className="text-xs text-muted-foreground">当前登录管理员不允许在此修改自己的角色。</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-reset-${user.id}`}>重置密码（可选）</Label>
            <Input
              id={`edit-reset-${user.id}`}
              type="password"
              placeholder="不填则不修改密码"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存修改"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserManagement({ currentUserId }: { currentUserId: number }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [roleFilter, setRoleFilter] = useState<string>(ROLE_ALL);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_ALL);
  const [keyword, setKeyword] = useState("");

  async function fetchUsers(overrides?: {
    roleFilter?: string;
    statusFilter?: string;
    keyword?: string;
  }) {
    setLoading(true);

    try {
      const nextRoleFilter = overrides?.roleFilter ?? roleFilter;
      const nextStatusFilter = overrides?.statusFilter ?? statusFilter;
      const nextKeyword = overrides?.keyword ?? keyword;

      const params = new URLSearchParams();

      if (nextRoleFilter !== ROLE_ALL) {
        params.set("role", nextRoleFilter);
      }

      if (nextStatusFilter !== STATUS_ALL) {
        params.set("status", nextStatusFilter);
      }

      if (nextKeyword.trim()) {
        params.set("keyword", nextKeyword.trim());
      }

      const response = await fetch(`/api/users?${params.toString()}`, {
        method: "GET",
      });

      const result = (await response.json()) as UsersResponse;

      if (!response.ok || !result.data) {
        toast.error(result.message ?? "加载用户列表失败");
        return;
      }

      setUsers(result.data);
    } catch {
      toast.error("加载用户列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleStatus(user: UserItem) {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isEnabled: !user.isEnabled,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(result.message ?? "更新状态失败");
        return;
      }

      toast.success(user.isEnabled ? "用户已停用" : "用户已启用");
      await fetchUsers();
    } catch {
      toast.error("更新状态失败，请稍后重试");
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchUsers();
  }

  async function handleRoleFilterChange(nextRoleFilter: string) {
    setRoleFilter(nextRoleFilter);
    await fetchUsers({ roleFilter: nextRoleFilter });
  }

  async function handleReset() {
    setRoleFilter(ROLE_ALL);
    setStatusFilter(STATUS_ALL);
    setKeyword("");
    await fetchUsers({ roleFilter: ROLE_ALL, statusFilter: STATUS_ALL, keyword: "" });
  }

  return (
    <div className="space-y-4">
      <Tabs value={roleFilter} onValueChange={(value) => void handleRoleFilterChange(value)}>
        <TabsList className="grid w-full grid-cols-4 md:w-[520px]">
          <TabsTrigger value={ROLE_ALL}>全部</TabsTrigger>
          <TabsTrigger value="ADMIN">管理员</TabsTrigger>
          <TabsTrigger value="PROMOTER">发展人</TabsTrigger>
          <TabsTrigger value="PART_TIME">兼职</TabsTrigger>
        </TabsList>
      </Tabs>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-12" onSubmit={handleSearch}>
        <div className="md:col-span-4">
          <Input
            placeholder="搜索账号或姓名"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        <div className="md:col-span-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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

        <div className="flex gap-2 md:col-span-5 md:justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            查询
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
            重置
          </Button>
          <CreateUserDialog onCreated={fetchUsers} />
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>账号</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建日期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在加载数据...
                  </span>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  暂无符合条件的用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{user.displayName ?? "-"}</span>
                      {user.id === currentUserId ? (
                        <Badge variant="outline" className="text-xs">
                          当前账号
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
                  </TableCell>
                  <TableCell>{user.isEnabled ? <Badge>启用中</Badge> : <Badge variant="secondary">已停用</Badge>}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <UserEditDialog
                        user={user}
                        onUpdated={fetchUsers}
                        isCurrentUser={user.id === currentUserId}
                      />
                      <Button
                        size="sm"
                        variant={user.isEnabled ? "destructive" : "default"}
                        disabled={user.id === currentUserId}
                        onClick={() => {
                          void handleToggleStatus(user);
                        }}
                      >
                        {user.isEnabled ? "停用" : "启用"}
                      </Button>
                    </div>
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
