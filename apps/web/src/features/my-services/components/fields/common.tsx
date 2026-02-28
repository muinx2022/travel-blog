"use client";

import type { ReactNode } from "react";

type MyServiceStatusBadgeProps = {
  published: boolean;
};

export function MyServiceStatusBadge({ published }: MyServiceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {published ? "Đã xuất bản" : "Bản nháp"}
    </span>
  );
}

export function MyServiceFieldMeta({ children }: { children: ReactNode }) {
  return <span className="text-xs text-zinc-500">{children}</span>;
}
