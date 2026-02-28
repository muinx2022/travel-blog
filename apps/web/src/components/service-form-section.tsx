import type { ReactNode } from "react";

type ServiceFormSectionProps = {
  icon: ReactNode;
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
};

export function ServiceFormSection({
  icon,
  title,
  headerRight,
  children,
  bodyClassName = "space-y-5 p-6",
}: ServiceFormSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              {title}
            </h2>
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
