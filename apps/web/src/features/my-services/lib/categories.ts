import type { CategoryItem, CategoryTreeOption } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

export async function fetchMyServiceCategories(): Promise<CategoryItem[]> {
  const query = new URLSearchParams({
    sort: "sortOrder:asc",
    "fields[0]": "id",
    "fields[1]": "documentId",
    "fields[2]": "name",
    "fields[3]": "sortOrder",
    "populate[parent][fields][0]": "id",
    "populate[parent][fields][1]": "documentId",
    "pagination[page]": "1",
    "pagination[pageSize]": "1000",
  });

  const res = await fetch(`${API_URL}/api/categories?${query.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const payload = (await res.json().catch(() => ({}))) as { data?: CategoryItem[] };
  return payload.data ?? [];
}

export function buildCategoryTreeOptions(categories: CategoryItem[]): CategoryTreeOption[] {
  const byParent = new Map<string | null, CategoryItem[]>();

  for (const item of categories) {
    const parentDocumentId = item.parent?.documentId ?? null;
    const bucket = byParent.get(parentDocumentId) ?? [];
    bucket.push(item);
    byParent.set(parentDocumentId, bucket);
  }

  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const flattened: CategoryTreeOption[] = [];
  const visit = (parentDocumentId: string | null, depth: number) => {
    for (const node of byParent.get(parentDocumentId) ?? []) {
      flattened.push({
        value: node.documentId,
        label: node.name,
        depth,
      });
      visit(node.documentId, depth + 1);
    }
  };

  visit(null, 0);
  return flattened;
}

