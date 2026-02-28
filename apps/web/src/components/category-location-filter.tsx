"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type CategoryOption = {
  documentId: string;
  name: string;
  slug: string;
};

type CategoryLocationFilterProps = {
  basePath: string;
  categories: CategoryOption[];
  activeCategorySlug?: string;
  defaultLabel?: string;
};

export function CategoryLocationFilter({
  basePath,
  categories,
  activeCategorySlug,
  defaultLabel = "Chọn địa danh",
}: CategoryLocationFilterProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeCategory = categories.find((cat) => cat.slug === activeCategorySlug);
  const triggerLabel = activeCategory ? activeCategory.name : defaultLabel;

  useEffect(() => {
    if (!open) return;
    const selectedKey = activeCategorySlug || "__all__";
    const selectedNode = optionRefs.current[selectedKey];
    if (!selectedNode) return;
    requestAnimationFrame(() => {
      selectedNode.focus();
      selectedNode.scrollIntoView({ block: "nearest" });
    });
  }, [open, activeCategorySlug]);

  return (
    <div ref={boxRef} className="relative mt-5 w-full max-w-3xl">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-w-[220px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:shadow md:min-w-[260px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-600"
      >
        <span className="truncate">{triggerLabel}</span>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 transition-transform dark:bg-slate-800 dark:text-slate-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
            <span>Danh sách địa danh</span>
            <Link
              href={basePath}
              ref={(node) => {
                optionRefs.current["__all__"] = node;
              }}
              className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-300"
              onClick={() => setOpen(false)}
            >
              (Xóa lựa chọn)
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat) => {
                const isActive = activeCategorySlug === cat.slug;
                const href = `${basePath}?cat=${encodeURIComponent(cat.slug)}`;

                return (
                  <Link
                    key={cat.documentId}
                    href={href}
                    ref={(node) => {
                      optionRefs.current[cat.slug || "__all__"] = node;
                    }}
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-sky-600 text-white"
                        : "border border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-600 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="line-clamp-1">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
