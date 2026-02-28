"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, ImagePlus, Pencil, Trash2, X, Video, FileImage } from "lucide-react";
import {
  type EntityMediaItem,
  type MediaCategory,
  listEntityMedia,
  uploadEntityMedia,
  updateEntityMedia,
  deleteEntityMedia,
  reorderEntityMedia,
  generatePendingId,
} from "@/lib/entity-media-api";

type EntityMediaManagerProps = {
  entityType: string;
  entityDocumentId?: string;
  category?: MediaCategory;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  onChange?: (medias: EntityMediaItem[]) => void;
  onPendingIdGenerated?: (pendingId: string) => void;
};

type EditingMedia = {
  documentId: string;
  caption: string;
  altText: string;
};

export function EntityMediaManager({
  entityType,
  entityDocumentId,
  category = "gallery",
  multiple = true,
  maxFiles = 20,
  label,
  onChange,
  onPendingIdGenerated,
}: EntityMediaManagerProps) {
  const [medias, setMedias] = useState<EntityMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingMedia | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveDocumentId = entityDocumentId || pendingId;

  const load = useCallback(async () => {
    if (!effectiveDocumentId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await listEntityMedia({
        entityType,
        entityDocumentId: effectiveDocumentId,
        mediaCategory: category,
      });
      setMedias(data);
      onChange?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [entityType, effectiveDocumentId, category, onChange]);

  useEffect(() => {
    if (entityDocumentId) {
      void load();
    }
  }, [entityDocumentId, load]);

  useEffect(() => {
    if (!entityDocumentId && !pendingId) {
      const newPendingId = generatePendingId();
      setPendingId(newPendingId);
      onPendingIdGenerated?.(newPendingId);
    }
  }, [entityDocumentId, pendingId, onPendingIdGenerated]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!effectiveDocumentId) {
      setError("Cannot upload without entity ID");
      return;
    }

    const fileArray = Array.from(files);
    const allowedCount = multiple ? Math.min(fileArray.length, maxFiles - medias.length) : 1;
    const filesToUpload = fileArray.slice(0, allowedCount);

    if (filesToUpload.length === 0) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploaded = await uploadEntityMedia(filesToUpload, {
        entityType,
        entityDocumentId: effectiveDocumentId,
        mediaCategory: category,
        sortOrder: medias.length,
      });

      const newMedias = multiple ? [...medias, ...uploaded] : uploaded;
      setMedias(newMedias);
      onChange?.(newMedias);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa media này?")) return;

    try {
      await deleteEntityMedia(documentId);
      const newMedias = medias.filter((m) => m.documentId !== documentId);
      setMedias(newMedias);
      onChange?.(newMedias);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleEditSave = async () => {
    if (!editing) return;

    try {
      const updated = await updateEntityMedia(editing.documentId, {
        caption: editing.caption,
        altText: editing.altText,
      });
      const newMedias = medias.map((m) =>
        m.documentId === editing.documentId ? updated : m
      );
      setMedias(newMedias);
      onChange?.(newMedias);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMedias = [...medias];
    const [dragged] = newMedias.splice(draggedIndex, 1);
    newMedias.splice(index, 0, dragged);
    setMedias(newMedias);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    const items = medias.map((m, i) => ({
      documentId: m.documentId,
      sortOrder: i,
    }));

    try {
      await reorderEntityMedia(items);
      onChange?.(medias);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
    }

    setDraggedIndex(null);
  };

  const isImage = (mime: string) => mime?.startsWith("image/");
  const isVideo = (mime: string) => mime?.startsWith("video/");

  const acceptTypes = category === "video" ? "video/*" : "image/*,video/*";
  const displayLabel = label || (category === "thumbnail" ? "Ảnh đại diện" : category === "video" ? "Video" : "Thư viện ảnh");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {displayLabel}
        </label>
        {(multiple || medias.length === 0) && medias.length < maxFiles && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            <ImagePlus className="h-3.5 w-3.5" />
            <span>Thêm {category === "video" ? "video" : "ảnh"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              multiple={multiple}
              className="sr-only"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {!loading && medias.length === 0 && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-zinc-800">
          {category === "video" ? (
            <Video className="h-10 w-10 text-zinc-400" />
          ) : (
            <FileImage className="h-10 w-10 text-zinc-400" />
          )}
          <p className="mt-2 text-sm text-zinc-500">
            {uploading ? "Đang tải lên..." : `Kéo thả hoặc click để chọn ${category === "video" ? "video" : "ảnh"}`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            multiple={multiple}
            className="sr-only"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      )}

      {!loading && medias.length > 0 && (
        <div className={`grid gap-3 ${multiple ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1 max-w-xs"}`}>
          {medias.map((media, index) => (
            <div
              key={media.documentId}
              draggable={multiple}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all dark:bg-zinc-900 ${
                draggedIndex === index
                  ? "border-blue-500 opacity-50"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {multiple && (
                <div className="absolute left-1 top-1 z-10 cursor-grab rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-4 w-4 text-white" />
                </div>
              )}

              <div className="absolute right-1 top-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      documentId: media.documentId,
                      caption: media.caption || "",
                      altText: media.altText || "",
                    })
                  }
                  className="rounded bg-black/50 p-1.5 text-white hover:bg-black/70"
                  title="Chỉnh sửa"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(media.documentId)}
                  className="rounded bg-red-500/80 p-1.5 text-white hover:bg-red-600"
                  title="Xóa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="aspect-square">
                {isImage(media.file?.mime) && (
                  <Image
                    src={media.file.url}
                    alt={media.altText || media.caption || "Media"}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                )}
                {isVideo(media.file?.mime) && (
                  <video
                    src={media.file.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                )}
              </div>

              {media.caption && (
                <p className="truncate border-t border-zinc-100 px-2 py-1.5 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  {media.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Đang tải lên...</span>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Chỉnh sửa media
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Caption
                </label>
                <input
                  type="text"
                  value={editing.caption}
                  onChange={(e) =>
                    setEditing({ ...editing, caption: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="Mô tả ảnh"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={editing.altText}
                  onChange={(e) =>
                    setEditing({ ...editing, altText: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="Văn bản thay thế cho ảnh"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { generatePendingId };
