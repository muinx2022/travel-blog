import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type ServiceFormLayoutProps = {
  backHref?: string;
  backLabel?: string;
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  loading?: boolean;
  headerInFrame?: boolean;
  children: ReactNode;
};

export function ServiceFormLayout({
  backHref = "/my-services",
  backLabel = "Quay lại danh sách dịch vụ",
  icon,
  iconClassName,
  title,
  subtitle,
  loading = false,
  headerInFrame = false,
  children,
}: ServiceFormLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div
        className={
          headerInFrame
            ? "rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 md:p-6"
            : ""
        }
      >
        <div className="mb-6">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {backLabel}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ${iconClassName}`}
            >
              {icon}
            </div>
            {title}
          </h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
