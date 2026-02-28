"use client";

import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth-context";

export function AccountBanBanner() {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn || !user?.isBanned) {
    return null;
  }

  return (
    <div className="relative z-30 border-y border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
      <div className="mx-auto flex w-full max-w-6xl items-start gap-2 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <span className="font-semibold">Bạn đã bị cấm hoạt động trên website.</span>{" "}
          Lý do: {user.banReason?.trim() || "Không có lý do cụ thể."}
        </p>
      </div>
    </div>
  );
}

