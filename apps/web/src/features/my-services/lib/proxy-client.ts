import type { MyServiceListItem, Pagination, PublishStatus } from "../types";

export async function fetchMyServiceList<T extends MyServiceListItem>(
  endpoint: string,
  jwt: string,
  page: number,
  pageSize = 10,
) {
  const separator = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`${endpoint}${separator}page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => ({}))) as {
    data?: T[];
    meta?: { pagination?: Pagination };
    error?: string;
  };

  if (!res.ok) {
    throw new Error(payload.error || "Không tải được dữ liệu");
  }

  return {
    data: payload.data ?? [],
    pagination:
      payload.meta?.pagination ?? {
        page,
        pageSize,
        pageCount: 1,
        total: payload.data?.length ?? 0,
      },
  };
}

export async function toggleMyServiceStatus<T extends MyServiceListItem>(
  endpoint: string,
  jwt: string,
  item: T,
) {
  const typeMatch = endpoint.match(/[?&]type=([^&]+)/);
  const inferredType = typeMatch?.[1] ? decodeURIComponent(typeMatch[1]) : undefined;

  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      documentId: item.documentId,
      type: inferredType,
      action: "toggle",
      currentStatus: item.status ?? (item.publishedAt ? "published" : "draft"),
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  if (!res.ok || !payload.data) {
    throw new Error(payload.error || "Không đổi được trạng thái");
  }

  return payload.data;
}

export function isPublishedStatus(status?: PublishStatus, publishedAt?: string | null) {
  return status === "published" || Boolean(publishedAt);
}
