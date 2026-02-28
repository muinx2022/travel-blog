const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

export type MediaCategory = "thumbnail" | "gallery" | "video";

export type EntityMediaFile = {
  id: number;
  documentId?: string;
  name: string;
  url: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  formats?: Record<string, { url: string; width: number; height: number }>;
};

export type EntityMediaItem = {
  id: number;
  documentId: string;
  file: EntityMediaFile;
  caption?: string;
  altText?: string;
  mediaCategory: MediaCategory;
  sortOrder: number;
  entityType: string;
  entityDocumentId: string;
  author?: { id: number; username?: string };
  createdAt?: string;
  updatedAt?: string;
};

export type EntityMediaUploadParams = {
  entityType: string;
  entityDocumentId: string;
  mediaCategory?: MediaCategory;
  caption?: string;
  altText?: string;
  sortOrder?: number;
};

export type EntityMediaUpdateParams = {
  caption?: string;
  altText?: string;
  sortOrder?: number;
  mediaCategory?: MediaCategory;
};

export type EntityMediaListParams = {
  entityType: string;
  entityDocumentId: string;
  mediaCategory?: MediaCategory;
};

function resolveMediaUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

export function normalizeEntityMedia(item: EntityMediaItem): EntityMediaItem {
  return {
    ...item,
    file: item.file
      ? {
          ...item.file,
          url: resolveMediaUrl(item.file.url),
          formats: item.file.formats
            ? Object.fromEntries(
                Object.entries(item.file.formats).map(([key, format]) => [
                  key,
                  { ...format, url: resolveMediaUrl(format.url) },
                ])
              )
            : undefined,
        }
      : item.file,
  };
}

export async function listEntityMedia(
  params: EntityMediaListParams,
  token?: string
): Promise<EntityMediaItem[]> {
  const query = new URLSearchParams();
  query.set("filters[entityType]", params.entityType);
  query.set("filters[entityDocumentId]", params.entityDocumentId);
  if (params.mediaCategory) {
    query.set("filters[mediaCategory]", params.mediaCategory);
  }

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/entity-media-proxy?${query.toString()}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || error?.error || "Failed to fetch media");
  }

  const payload = (await res.json()) as { data?: EntityMediaItem[] };
  return (payload.data ?? []).map(normalizeEntityMedia);
}

export async function uploadEntityMedia(
  files: File | File[],
  params: EntityMediaUploadParams,
  token?: string
): Promise<EntityMediaItem[]> {
  const fileArray = Array.isArray(files) ? files : [files];
  const formData = new FormData();

  for (const file of fileArray) {
    formData.append("files", file);
  }

  formData.append("entityType", params.entityType);
  formData.append("entityDocumentId", params.entityDocumentId);
  if (params.mediaCategory) {
    formData.append("mediaCategory", params.mediaCategory);
  }
  if (params.caption) {
    formData.append("caption", params.caption);
  }
  if (params.altText) {
    formData.append("altText", params.altText);
  }
  if (params.sortOrder !== undefined) {
    formData.append("sortOrder", String(params.sortOrder));
  }

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/entity-media-proxy?action=upload", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || error?.error || "Failed to upload media");
  }

  const payload = (await res.json()) as { data?: EntityMediaItem[] };
  return (payload.data ?? []).map(normalizeEntityMedia);
}

export async function updateEntityMedia(
  documentId: string,
  params: EntityMediaUpdateParams,
  token?: string
): Promise<EntityMediaItem> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/entity-media-proxy?documentId=${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: params }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || error?.error || "Failed to update media");
  }

  const payload = (await res.json()) as { data?: EntityMediaItem };
  if (!payload.data) throw new Error("No data returned");
  return normalizeEntityMedia(payload.data);
}

export async function deleteEntityMedia(documentId: string, token?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/entity-media-proxy?documentId=${documentId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok && res.status !== 204) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || error?.error || "Failed to delete media");
  }
}

export async function reorderEntityMedia(
  items: Array<{ documentId: string; sortOrder: number }>,
  token?: string
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/entity-media-proxy?action=reorder", {
    method: "POST",
    headers,
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || error?.error || "Failed to reorder media");
  }
}

export async function bulkUpdateEntityDocumentId(
  pendingId: string,
  newDocumentId: string,
  token?: string
): Promise<{ updated: string[] }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/entity-media-proxy", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ pendingId, newDocumentId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || error?.error || "Failed to bulk update media");
  }

  const payload = (await res.json()) as { data?: { updated: string[] } };
  return payload.data ?? { updated: [] };
}

export function generatePendingId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
