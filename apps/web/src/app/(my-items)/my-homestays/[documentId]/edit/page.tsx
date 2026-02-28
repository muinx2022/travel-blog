"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { Home, Type, FolderOpen, FileText, Images, AlertCircle, Sparkles, Plus, Trash2 } from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { CategoryMultiSelect } from "@/features/my-services/components/CategoryMultiSelect";
import { useAuth } from "@/components/auth-context";
import { EntityMediaManager } from "@/components/entity-media-manager";
import { ServiceFormLayout } from "@/components/service-form-layout";
import { ServiceFormSection } from "@/components/service-form-section";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type CategoryItem = { id: number; documentId: string; name: string; sortOrder?: number; parent?: { id?: number; documentId?: string } | null };
type CategoryTreeOption = { value: string; label: string; depth: number };
type AmenityInput = { name: string };
type EditHomestayPayload = {
  documentId?: string;
  title?: string;
  content?: string;
  address?: string;
  city?: string;
  priceRange?: string;
  categories?: Array<{ documentId?: string }>;
  amenities?: Array<{ name: string }>;
};

function MultiSelectBox({ options, value, onChange, placeholder = "Chon danh muc" }: { options: CategoryTreeOption[]; value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  return <CategoryMultiSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />;
}

const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm transition-all duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-orange-400 dark:focus:ring-orange-400/10";

export default function EditMyHomestayPage() {
  const router = useRouter();
  const params = useParams<{ documentId: string }>();
  const documentId = String(params?.documentId ?? "").trim();
  const { isLoggedIn, jwt, openLoginModal } = useAuth();
  const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [showToolbar, setShowToolbar] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHomestay, setLoadingHomestay] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryDocumentIds, setSelectedCategoryDocumentIds] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<AmenityInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const categoryTreeOptions = useMemo(() => {
    const byParent = new Map<string | null, CategoryItem[]>();
    for (const item of categories) {
      const key = item.parent?.documentId ?? null;
      byParent.set(key, [...(byParent.get(key) ?? []), item]);
    }
    for (const bucket of byParent.values()) bucket.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const flat: CategoryTreeOption[] = [];
    const visit = (id: string | null, depth: number) => {
      for (const node of byParent.get(id) ?? []) {
        flat.push({ value: node.documentId, label: node.name, depth });
        visit(node.documentId, depth + 1);
      }
    };
    visit(null, 0);
    return flat;
  }, [categories]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoggedIn || !jwt) {
      openLoginModal();
      router.push("/");
      return;
    }
    if (!documentId) {
      setError("Khong tim thay homestay");
      return;
    }

    let active = true;

    const loadHomestay = async () => {
      setLoadingHomestay(true);
      try {
        const res = await fetch(`/api/my-homestays-proxy?documentId=${encodeURIComponent(documentId)}`, { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { data?: EditHomestayPayload; error?: string };
        if (!res.ok || !payload.data) throw new Error(payload.error || "Khong tai duoc homestay");
        if (!active) return;
        setTitle(payload.data.title ?? "");
        setContent(payload.data.content ?? "");
        setAddress(payload.data.address ?? "");
        setCity(payload.data.city ?? "");
        setPriceRange(payload.data.priceRange ?? "");
        setSelectedCategoryDocumentIds((payload.data.categories ?? []).map((c) => String(c.documentId ?? "").trim()).filter(Boolean));
        setAmenities((payload.data.amenities ?? []).map((a) => ({ name: a.name })));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Khong tai duoc homestay");
      } finally {
        if (active) setLoadingHomestay(false);
      }
    };

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const q = new URLSearchParams({ sort: "sortOrder:asc", "fields[0]": "id", "fields[1]": "documentId", "fields[2]": "name", "fields[3]": "sortOrder", "populate[parent][fields][0]": "id", "populate[parent][fields][1]": "documentId", "pagination[page]": "1", "pagination[pageSize]": "1000" });
        const res = await fetch(`${API_URL}/api/categories?${q}`, { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { data?: CategoryItem[] };
        if (active) setCategories(payload.data ?? []);
      } finally {
        if (active) setLoadingCategories(false);
      }
    };

    void Promise.all([loadHomestay(), loadCategories()]);
    return () => { active = false; };
  }, [isHydrated, isLoggedIn, jwt, openLoginModal, router, documentId]);

  const addAmenity = () => setAmenities((p) => [...p, { name: "" }]);
  const removeAmenity = (i: number) => setAmenities((p) => p.filter((_, j) => j !== i));
  const updateAmenity = (i: number, val: string) => setAmenities((p) => p.map((a, j) => (j === i ? { name: val } : a)));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jwt) { openLoginModal(); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/my-homestays-proxy", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ documentId, title, content, categories: selectedCategoryDocumentIds, address, city, priceRange, amenities: amenities.filter((a) => a.name.trim()) }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Cap nhat homestay that bai");
      router.push("/my-services");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cap nhat homestay that bai");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated || !isLoggedIn || !jwt) return null;

  return (
    <ServiceFormLayout
      icon={<Home className="h-5 w-5 text-white" />}
      iconClassName="from-orange-500 to-orange-600 shadow-orange-500/20"
      title="Sua homestay"
      subtitle="Cap nhat thong tin homestay cua ban."
      loading={loadingHomestay}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <ServiceFormSection icon={<Type className="h-4 w-4" />} title="Thong tin co ban">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ten homestay <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Nhap ten homestay..." className={inputCls.replace("text-sm", "text-base")} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Dia chi</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="So nha, ten duong..." className={inputCls} /></div>
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Thanh pho</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="VD: Da Lat" className={inputCls} /></div>
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Khoang gia</label><input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="VD: 200k - 500k/dem" className={inputCls} /></div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"><span className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-zinc-500" />Danh muc</span></label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50"><div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-orange-500"></div><span className="text-sm text-zinc-500 dark:text-zinc-400">Dang tai danh muc...</span></div>
            ) : (
              <div className="relative z-20 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"><MultiSelectBox options={categoryTreeOptions} value={selectedCategoryDocumentIds} onChange={setSelectedCategoryDocumentIds} placeholder="Chon mot hoac nhieu danh muc" /></div>
            )}
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<FileText className="h-4 w-4" />} title="Noi dung" bodyClassName="p-6"
          headerRight={<button type="button" onClick={() => setShowToolbar((v) => !v)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20">{showToolbar ? "An thanh cong cu" : "Hien thi thanh cong cu"}</button>}
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm focus-within:ring-4 focus-within:ring-orange-500/10 dark:border-zinc-700 dark:bg-zinc-800">
            <TiptapEditor value={content} onChange={setContent} showToolbar={showToolbar} />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Images className="h-4 w-4" />} title="Hinh anh" bodyClassName="space-y-6 p-6">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="homestay" entityDocumentId={documentId} category="thumbnail" multiple={false} label="Anh dai dien" />
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="homestay" entityDocumentId={documentId} category="gallery" multiple={true} maxFiles={20} label="Thu vien anh" />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Sparkles className="h-4 w-4" />} title="Tien ich" bodyClassName="space-y-4 p-6"
          headerRight={<button type="button" onClick={addAmenity} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"><Plus className="h-3.5 w-3.5" />Them</button>}
        >
          {amenities.length === 0 && <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">Chua co tien ich nao.</p>}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {amenities.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={a.name} onChange={(e) => updateAmenity(i, e.target.value)} placeholder="Ten tien ich" className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
                <button type="button" onClick={() => removeAmenity(i)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </ServiceFormSection>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button type="button" onClick={() => router.push("/my-services")} className="rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 active:scale-95 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700">Huy</button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>Dang cap nhat...</span> : "Luu thay doi"}
          </button>
        </div>
      </form>
    </ServiceFormLayout>
  );
}

