"use client";

import type { ReactNode } from "react";

type MyServiceFormShellProps = {
  title: string;
  description: string;
  error?: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  children: ReactNode;
};

export function MyServiceFormShell({
  title,
  description,
  error,
  onSubmit,
  children,
}: MyServiceFormShellProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {children}
      </form>
    </div>
  );
}

