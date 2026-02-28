import type { PublishStatus } from "../types";

type RowWithStatus = {
  id?: number;
  documentId?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  status?: PublishStatus;
  categories?: unknown;
};

export function sortRowsByLatest<T extends RowWithStatus>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aDate = new Date(a.updatedAt ?? a.publishedAt ?? a.createdAt ?? 0).getTime();
    const bDate = new Date(b.updatedAt ?? b.publishedAt ?? b.createdAt ?? 0).getTime();
    return bDate - aDate;
  });
}

export function mergeDraftAndPublishedRows<T extends RowWithStatus>(
  draftRows: T[],
  publishedRows: T[],
) {
  const merged = new Map<string, T>();

  for (const row of draftRows) {
    if (!row.documentId) continue;
    merged.set(row.documentId, {
      ...row,
      status: "draft",
      publishedAt: null,
    });
  }

  for (const row of publishedRows) {
    if (!row.documentId) continue;

    const existing = merged.get(row.documentId);
    if (!existing) {
      merged.set(row.documentId, {
        ...row,
        status: "published",
        publishedAt: row.publishedAt ?? null,
      });
      continue;
    }

    merged.set(row.documentId, {
      ...existing,
      id: existing.id ?? row.id,
      slug: existing.slug ?? row.slug,
      categories: existing.categories ?? row.categories,
      status: "published",
      publishedAt: row.publishedAt ?? null,
    });
  }

  return sortRowsByLatest(Array.from(merged.values()));
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;

  return {
    data: rows.slice(start, end),
    meta: {
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        pageCount,
        total,
      },
    },
  };
}

