"use client";

import { getStoredSession } from "@/lib/admin-auth";

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
  params: EntityMediaListParams
): Promise<EntityMediaItem[]> {
  const session = getStoredSession();
  if (!session?.jwt) throw new Error("Not authenticated");

  const query = new URLSearchParams();
  query.set("filters[entityType]", params.entityType);
  query.set("filters[entityDocumentId]", params.entityDocumentId);
  if (params.mediaCategory) {
    query.set("filters[mediaCategory]", params.mediaCategory);
  }

  const res = await fetch(`${API_URL}/api/entity-medias?${query.toString()}`, {
    headers: { Authorization: `Bearer ${session.jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to fetch media");
  }

  const payload = (await res.json()) as { data?: EntityMediaItem[] };
  return (payload.data ?? []).map(normalizeEntityMedia);
}

export async function uploadEntityMedia(
  files: File | File[],
  params: EntityMediaUploadParams
): Promise<EntityMediaItem[]> {
  const session = getStoredSession();
  if (!session?.jwt) throw new Error("Not authenticated");

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

  const res = await fetch(`${API_URL}/api/entity-medias/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.jwt}` },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to upload media");
  }

  const payload = (await res.json()) as { data?: EntityMediaItem[] };
  return (payload.data ?? []).map(normalizeEntityMedia);
}

export async function updateEntityMedia(
  documentId: string,
  params: EntityMediaUpdateParams
): Promise<EntityMediaItem> {
  const session = getStoredSession();
  if (!session?.jwt) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/entity-medias/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.jwt}`,
    },
    body: JSON.stringify({ data: params }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to update media");
  }

  const payload = (await res.json()) as { data?: EntityMediaItem };
  if (!payload.data) throw new Error("No data returned");
  return normalizeEntityMedia(payload.data);
}

export async function deleteEntityMedia(documentId: string): Promise<void> {
  const session = getStoredSession();
  if (!session?.jwt) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/entity-medias/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.jwt}` },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to delete media");
  }
}

export async function reorderEntityMedia(
  items: Array<{ documentId: string; sortOrder: number }>
): Promise<void> {
  const session = getStoredSession();
  if (!session?.jwt) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/entity-medias/reorder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.jwt}`,
    },
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to reorder media");
  }
}

export async function bulkUpdateEntityDocumentId(
  pendingId: string,
  newDocumentId: string,
  authorId?: number
): Promise<{ updated: string[] }> {
  const session = getStoredSession();
  if (!session?.jwt) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/entity-medias/bulk-update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.jwt}`,
    },
    body: JSON.stringify({ pendingId, newDocumentId, authorId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to bulk update media");
  }

  const payload = (await res.json()) as { data?: { updated: string[] } };
  return payload.data ?? { updated: [] };
}

export function generatePendingId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
