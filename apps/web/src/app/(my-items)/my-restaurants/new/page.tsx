"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Utensils, Type, FolderOpen, FileText, Images, AlertCircle } from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { CategoryMultiSelect } from "@/features/my-services/components/CategoryMultiSelect";
import { useAuth } from "@/components/auth-context";
import { EntityMediaManager, generatePendingId } from "@/components/entity-media-manager";
import { bulkUpdateEntityDocumentId } from "@/lib/entity-media-api";
import { ServiceFormLayout } from "@/components/service-form-layout";
import { ServiceFormSection } from "@/components/service-form-section";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type CategoryItem = { id: number; documentId: string; name: string; sortOrder?: number; parent?: { id?: number; documentId?: string } | null };
type CategoryTreeOption = { value: string; label: string; depth: number };

function MultiSelectBox({ options, value, onChange, placeholder = "Chọn danh mục" }: { options: CategoryTreeOption[]; value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  return <CategoryMultiSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />;
}

const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm transition-all duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-rose-400 dark:focus:ring-rose-400/10";

export default function NewMyRestaurantPage() {
  const router = useRouter();
  const { isLoggedIn, jwt, openLoginModal } = useAuth();
  const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [showToolbar, setShowToolbar] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryDocumentIds, setSelectedCategoryDocumentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mediaPendingId] = useState(() => generatePendingId());

  const categoryTreeOptions = useMemo(() => {
    const byParent = new Map<string | null, CategoryItem[]>();
    for (const item of categories) { const key = item.parent?.documentId ?? null; byParent.set(key, [...(byParent.get(key) ?? []), item]); }
    for (const bucket of byParent.values()) bucket.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const flat: CategoryTreeOption[] = [];
    const visit = (id: string | null, depth: number) => { for (const n of byParent.get(id) ?? []) { flat.push({ value: n.documentId, label: n.name, depth }); visit(n.documentId, depth + 1); } };
    visit(null, 0); return flat;
  }, [categories]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoggedIn || !jwt) { openLoginModal(); router.push("/"); return; }
    let active = true;
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const q = new URLSearchParams({ sort: "sortOrder:asc", "fields[0]": "id", "fields[1]": "documentId", "fields[2]": "name", "fields[3]": "sortOrder", "populate[parent][fields][0]": "id", "populate[parent][fields][1]": "documentId", "pagination[page]": "1", "pagination[pageSize]": "1000" });
        const res = await fetch(`${API_URL}/api/categories?${q}`, { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { data?: CategoryItem[] };
        if (active) setCategories(payload.data ?? []);
      } finally { if (active) setLoadingCategories(false); }
    };
    void loadCategories(); return () => { active = false; };
  }, [isHydrated, isLoggedIn, jwt, openLoginModal, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jwt) { openLoginModal(); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/my-restaurants-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ title, content, categories: selectedCategoryDocumentIds, address, city, cuisineType, priceRange }),
      });
      const payload = (await res.json().catch(() => ({}))) as { data?: { documentId?: string }; error?: string };
      if (!res.ok) throw new Error(payload.error || "Tạo nhà hàng thất bại");
      if (payload.data?.documentId && mediaPendingId) await bulkUpdateEntityDocumentId(mediaPendingId, payload.data.documentId, jwt ?? undefined);
      router.push("/my-services"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Tạo nhà hàng thất bại"); }
    finally { setSubmitting(false); }
  };

  if (!isHydrated || !isLoggedIn || !jwt) return null;

  return (
    <ServiceFormLayout
      headerInFrame
      icon={<Utensils className="h-5 w-5 text-white" />}
      iconClassName="from-rose-500 to-rose-600 shadow-rose-500/20"
      title="Tạo nhà hàng"
      subtitle="Thêm nhà hàng mới của bạn."
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <ServiceFormSection icon={<Type className="h-4 w-4" />} title="Thông tin cơ bản">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tên nhà hàng <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Nhập tên nhà hàng..." className={inputCls.replace("text-sm", "text-base")} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Địa chỉ</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, tên đường..." className={inputCls} /></div>
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Thành phố</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="VD: Hà Nội" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Loại ẩm thực</label><input value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} placeholder="VD: Việt Nam, Hàn Quốc..." className={inputCls} /></div>
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Khoảng giá</label><input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="VD: 50k - 200k/người" className={inputCls} /></div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"><span className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-zinc-500" />Danh mục</span></label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50"><div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-rose-500"></div><span className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải danh mục...</span></div>
            ) : (
              <div className="relative z-20 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"><MultiSelectBox options={categoryTreeOptions} value={selectedCategoryDocumentIds} onChange={setSelectedCategoryDocumentIds} placeholder="Chọn một hoặc nhiều danh mục" /></div>
            )}
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<FileText className="h-4 w-4" />} title="Nội dung" bodyClassName="p-6"
          headerRight={<button type="button" onClick={() => setShowToolbar((v) => !v)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20">{showToolbar ? "Ẩn thanh công cụ" : "Hiển thị thanh công cụ"}</button>}
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm focus-within:ring-4 focus-within:ring-rose-500/10 dark:border-zinc-700 dark:bg-zinc-800">
            <TiptapEditor value={content} onChange={setContent} showToolbar={showToolbar} />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Images className="h-4 w-4" />} title="Hình ảnh" bodyClassName="space-y-6 p-6">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="restaurant" entityDocumentId={mediaPendingId} category="thumbnail" multiple={false} label="Ảnh đại diện" />
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="restaurant" entityDocumentId={mediaPendingId} category="gallery" multiple={true} maxFiles={20} label="Thư viện ảnh" />
          </div>
        </ServiceFormSection>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button type="button" onClick={() => router.push("/my-services")} className="rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 active:scale-95 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700">Hủy</button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:from-rose-700 hover:to-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>Đang tạo...</span> : "Tạo nhà hàng"}
          </button>
        </div>
      </form>
    </ServiceFormLayout>
  );
}

