"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        toast.error("退出失败，请稍后重试");
        return;
      }

      toast.success("已退出登录");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("退出失败，请稍后重试");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      退出
    </Button>
  );
}
