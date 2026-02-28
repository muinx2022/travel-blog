"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Search, Trash2, Filter, Video, FileImage, RefreshCw } from "lucide-react";
import { getStoredSession } from "@/lib/admin-auth";
import {
  type EntityMediaItem,
  type MediaCategory,
  normalizeEntityMedia,
  deleteEntityMedia,
} from "@/lib/entity-media-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type FilterState = {
  entityType: string;
  mediaCategory: string;
  search: string;
};

export default function MediaPage() {
  const [medias, setMedias] = useState<EntityMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    entityType: "",
    mediaCategory: "",
    search: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const session = getStoredSession();
    if (!session?.jwt) return;

    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      query.set("populate[file]", "true");
      query.set("populate[author]", "true");
      query.set("sort", "createdAt:desc");
      query.set("pagination[pageSize]", "100");

      if (filters.entityType) {
        query.set("filters[entityType][$eq]", filters.entityType);
      }
      if (filters.mediaCategory) {
        query.set("filters[mediaCategory][$eq]", filters.mediaCategory);
      }
      if (filters.search) {
        query.set("filters[$or][0][caption][$containsi]", filters.search);
        query.set("filters[$or][1][altText][$containsi]", filters.search);
        query.set("filters[$or][2][entityDocumentId][$containsi]", filters.search);
      }

      const res = await fetch(`${API_URL}/api/entity-medias?${query.toString()}`, {
        headers: { Authorization: `Bearer ${session.jwt}` },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch media");
      }

      const payload = (await res.json()) as { data?: EntityMediaItem[] };
      setMedias((payload.data ?? []).map(normalizeEntityMedia));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (documentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa media này?")) return;

    try {
      await deleteEntityMedia(documentId);
      setMedias((prev) => prev.filter((m) => m.documentId !== documentId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.size} media?`)) return;

    for (const documentId of selectedIds) {
      try {
        await deleteEntityMedia(documentId);
      } catch {
        // Continue with others
      }
    }

    setMedias((prev) => prev.filter((m) => !selectedIds.has(m.documentId)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (documentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === medias.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(medias.map((m) => m.documentId)));
    }
  };

  const isImage = (mime?: string) => mime?.startsWith("image/");
  const isVideo = (mime?: string) => mime?.startsWith("video/");

  const entityTypes = [...new Set(medias.map((m) => m.entityType))];
  const mediaCategories: MediaCategory[] = ["thumbnail", "gallery", "video"];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Quản lý Media
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Tất cả media đã upload trong hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lọc:</span>
        </div>

        <select
          value={filters.entityType}
          onChange={(e) => setFilters((prev) => ({ ...prev, entityType: e.target.value }))}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">Tất cả entity</option>
          {entityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.mediaCategory}
          onChange={(e) => setFilters((prev) => ({ ...prev, mediaCategory: e.target.value }))}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">Tất cả loại</option>
          {mediaCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Tìm theo caption, alt text..."
            className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={handleBulkDelete}
            className="ml-auto inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Xóa {selectedIds.size} đã chọn
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {!loading && medias.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
          <FileImage className="h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Chưa có media nào
          </p>
        </div>
      )}

      {!loading && medias.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === medias.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Chọn tất cả
            </label>
            <span>•</span>
            <span>{medias.length} media</span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {medias.map((media) => (
              <div
                key={media.documentId}
                className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all dark:bg-zinc-900 ${
                  selectedIds.has(media.documentId)
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="absolute left-2 top-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(media.documentId)}
                    onChange={() => toggleSelect(media.documentId)}
                    className="h-4 w-4 rounded border-zinc-300 bg-white/80"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(media.documentId)}
                  className="absolute right-2 top-2 z-10 rounded bg-red-500/80 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  title="Xóa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="aspect-square">
                  {isImage(media.file?.mime) && (
                    <Image
                      src={media.file.url}
                      alt={media.altText || media.caption || "Media"}
                      width={150}
                      height={150}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  )}
                  {isVideo(media.file?.mime) && (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                      <Video className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-100 p-2 dark:border-zinc-800">
                  <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {media.entityType}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {media.mediaCategory}
                  </p>
                  {media.caption && (
                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {media.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
