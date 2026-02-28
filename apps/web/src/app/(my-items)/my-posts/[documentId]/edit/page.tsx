"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Type, FolderOpen, Images, AlertCircle } from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { CategoryMultiSelect } from "@/features/my-services/components/CategoryMultiSelect";
import { useAuth } from "@/components/auth-context";
import { EntityMediaManager } from "@/components/entity-media-manager";
import { ServiceFormLayout } from "@/components/service-form-layout";
import { ServiceFormSection } from "@/components/service-form-section";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type CategoryItem = {
  id: number;
  documentId: string;
  name: string;
  sortOrder?: number;
  parent?: { id?: number; documentId?: string } | null;
};

type CategoryTreeOption = { value: string; label: string; depth: number };

type EditPostPayload = {
  documentId?: string;
  title?: string;
  content?: string;
  categories?: Array<{ documentId?: string }>;
};

function MultiSelectBox({
  options,
  value,
  onChange,
  placeholder = "Chọn danh mục",
}: {
  options: CategoryTreeOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <CategoryMultiSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />
  );
}

export default function EditMyPostPage() {
  const router = useRouter();
  const params = useParams<{ documentId: string }>();
  const documentId = String(params?.documentId ?? "").trim();
  const { isLoggedIn, jwt, openLoginModal } = useAuth();
  const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showToolbar, setShowToolbar] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryDocumentIds, setSelectedCategoryDocumentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const categoryTreeOptions = useMemo(() => {
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
    const visit = (parentDocumentId: string | null, level: number) => {
      for (const node of byParent.get(parentDocumentId) ?? []) {
        flattened.push({ value: node.documentId, label: node.name, depth: level });
        visit(node.documentId, level + 1);
      }
    };
    visit(null, 0);
    return flattened;
  }, [categories]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoggedIn || !jwt) {
      openLoginModal();
      router.push("/");
      return;
    }
    if (!documentId) {
      setError("Không tìm thấy bài viết");
      return;
    }

    let active = true;

    const loadPost = async () => {
      setLoadingPost(true);
      try {
        const res = await fetch(`/api/my-posts-proxy?documentId=${encodeURIComponent(documentId)}`, {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: "no-store",
        });
        const payload = (await res.json().catch(() => ({}))) as { data?: EditPostPayload; error?: string };
        if (!res.ok || !payload.data) throw new Error(payload.error || "Không tải được bài viết");
        if (!active) return;

        setTitle(payload.data.title ?? "");
        setContent(payload.data.content ?? "");
        setSelectedCategoryDocumentIds(
          (payload.data.categories ?? []).map((item) => String(item.documentId ?? "").trim()).filter(Boolean),
        );
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Không tải được bài viết");
      } finally {
        if (active) setLoadingPost(false);
      }
    };

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
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
        const res = await fetch(`${API_URL}/api/categories?${query.toString()}`, { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { data?: CategoryItem[] };
        if (active) setCategories(payload.data ?? []);
      } finally {
        if (active) setLoadingCategories(false);
      }
    };

    void Promise.all([loadPost(), loadCategories()]);
    return () => { active = false; };
  }, [isHydrated, isLoggedIn, jwt, openLoginModal, router, documentId]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jwt) { openLoginModal(); return; }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/my-posts-proxy", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ documentId, title, content, categories: selectedCategoryDocumentIds }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Cập nhật bài viết thất bại");

      router.push("/my-services");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Cập nhật bài viết thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated || !isLoggedIn || !jwt) return null;

  return (
    <ServiceFormLayout
      icon={<FileText className="h-5 w-5 text-white" />}
      iconClassName="from-blue-500 to-blue-600 shadow-blue-500/20"
      title="Sửa bài viết"
      subtitle="Cập nhật nội dung bài viết của bạn."
      loading={loadingPost}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <ServiceFormSection icon={<Type className="h-4 w-4" />} title="Thông tin cơ bản">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-800 shadow-sm transition-all duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-blue-400 dark:focus:ring-blue-400/10"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-zinc-500" />
                Danh mục
              </span>
            </label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500"></div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải danh mục...</span>
              </div>
            ) : (
              <div className="relative z-20 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <MultiSelectBox
                  options={categoryTreeOptions}
                  value={selectedCategoryDocumentIds}
                  onChange={setSelectedCategoryDocumentIds}
                  placeholder="Chọn một hoặc nhiều danh mục"
                />
              </div>
            )}
          </div>
        </ServiceFormSection>

        <ServiceFormSection
          icon={<FileText className="h-4 w-4" />}
          title="Nội dung"
          bodyClassName="p-6"
          headerRight={
            <button
              type="button"
              onClick={() => setShowToolbar((v) => !v)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
            >
              {showToolbar ? "Ẩn thanh công cụ" : "Hiển thị thanh công cụ"}
            </button>
          }
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:ring-blue-400/10">
            <TiptapEditor value={content} onChange={setContent} showToolbar={showToolbar} />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Images className="h-4 w-4" />} title="Hình ảnh" bodyClassName="space-y-6 p-6">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="post" entityDocumentId={documentId} category="thumbnail" multiple={false} label="Ảnh đại diện" />
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="post" entityDocumentId={documentId} category="gallery" multiple={true} maxFiles={20} label="Thư viện ảnh" />
          </div>
        </ServiceFormSection>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/my-services")}
            className="rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 active:scale-95 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:focus:ring-zinc-500/20"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                Đang cập nhật...
              </span>
            ) : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </ServiceFormLayout>
  );
}
