"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { CategoryTreeOption } from "../types";

type CategoryMultiSelectProps = {
  options: CategoryTreeOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function CategoryMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn danh mục",
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedItems = useMemo(
    () => options.filter((item) => value.includes(item.value)),
    [options, value],
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target;
      if (!(targetNode instanceof Node)) return;
      if (!containerRef.current?.contains(targetNode)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex flex-1 flex-wrap items-center gap-1 text-left">
          {selectedItems.length === 0 && (
            <span className="text-zinc-500 dark:text-zinc-400">{placeholder}</span>
          )}
          {selectedItems.map((item) => (
            <span
              key={item.value}
              className="inline-flex items-center gap-1 rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
            >
              {item.label}
              <span
                role="button"
                aria-label={`Remove ${item.label}`}
                title={`Remove ${item.label}`}
                className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange(value.filter((v) => v !== item.value));
                }}
              >
                <X className="h-3 w-3" />
              </span>
            </span>
          ))}
        </span>
        <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-md dark:border-zinc-700 dark:bg-zinc-950">
          {options.map((option) => {
            const checked = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => toggleOption(option.value)}
                style={{ paddingLeft: `${8 + option.depth * 16}px` }}
              >
                <span>{option.label}</span>
                {checked && <Check className="h-4 w-4" />}
              </button>
            );
          })}
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Chưa có danh mục
            </p>
          )}
        </div>
      )}
    </div>
  );
}
