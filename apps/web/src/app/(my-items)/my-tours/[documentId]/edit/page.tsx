"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Type, FolderOpen, FileText, Images, AlertCircle, Calendar, Plus, Trash2 } from "lucide-react";
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

type ItineraryDayInput = { label: string; title: string; description: string };

type EditTourPayload = {
  documentId?: string;
  title?: string;
  content?: string;
  destination?: string;
  duration?: number;
  price?: number;
  categories?: Array<{ documentId?: string }>;
  itinerary?: Array<{ label: string; title: string; description?: string }>;
};

function MultiSelectBox({
  options, value, onChange, placeholder = "Chọn danh mục",
}: { options: CategoryTreeOption[]; value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  return <CategoryMultiSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />;
}

const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm transition-all duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10";

export default function EditMyTourPage() {
  const router = useRouter();
  const params = useParams<{ documentId: string }>();
  const documentId = String(params?.documentId ?? "").trim();
  const { isLoggedIn, jwt, openLoginModal } = useAuth();
  const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [showToolbar, setShowToolbar] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTour, setLoadingTour] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryDocumentIds, setSelectedCategoryDocumentIds] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryDayInput[]>([]);
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
      for (const node of byParent.get(id) ?? []) { flat.push({ value: node.documentId, label: node.name, depth }); visit(node.documentId, depth + 1); }
    };
    visit(null, 0);
    return flat;
  }, [categories]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoggedIn || !jwt) { openLoginModal(); router.push("/"); return; }
    if (!documentId) { setError("Không tìm thấy tour"); return; }

    let active = true;

    const loadTour = async () => {
      setLoadingTour(true);
      try {
        const res = await fetch(`/api/my-tours-proxy?documentId=${encodeURIComponent(documentId)}`, { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { data?: EditTourPayload; error?: string };
        if (!res.ok || !payload.data) throw new Error(payload.error || "Không tải được tour");
        if (!active) return;
        setTitle(payload.data.title ?? "");
        setContent(payload.data.content ?? "");
        setDestination(payload.data.destination ?? "");
        setDuration(payload.data.duration != null ? String(payload.data.duration) : "");
        setPrice(payload.data.price != null ? String(payload.data.price) : "");
        setSelectedCategoryDocumentIds((payload.data.categories ?? []).map((c) => String(c.documentId ?? "").trim()).filter(Boolean));
        setItinerary((payload.data.itinerary ?? []).map((d) => ({ label: d.label, title: d.title, description: d.description ?? "" })));
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Không tải được tour"); }
      finally { if (active) setLoadingTour(false); }
    };

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const q = new URLSearchParams({ sort: "sortOrder:asc", "fields[0]": "id", "fields[1]": "documentId", "fields[2]": "name", "fields[3]": "sortOrder", "populate[parent][fields][0]": "id", "populate[parent][fields][1]": "documentId", "pagination[page]": "1", "pagination[pageSize]": "1000" });
        const res = await fetch(`${API_URL}/api/categories?${q}`, { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { data?: CategoryItem[] };
        if (active) setCategories(payload.data ?? []);
      } finally { if (active) setLoadingCategories(false); }
    };

    void Promise.all([loadTour(), loadCategories()]);
    return () => { active = false; };
  }, [isHydrated, isLoggedIn, jwt, openLoginModal, router, documentId]);

  const addDay = () => setItinerary((p) => [...p, { label: `Ngày ${p.length + 1}`, title: "", description: "" }]);
  const removeDay = (i: number) => setItinerary((p) => p.filter((_, j) => j !== i));
  const updateDay = (i: number, field: keyof ItineraryDayInput, val: string) =>
    setItinerary((p) => p.map((d, j) => (j === i ? { ...d, [field]: val } : d)));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jwt) { openLoginModal(); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/my-tours-proxy", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ documentId, title, content, categories: selectedCategoryDocumentIds, destination, duration: duration ? Number(duration) : undefined, price: price ? Number(price) : undefined, itinerary: itinerary.filter((d) => d.title.trim()) }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Cập nhật tour thất bại");
      router.push("/my-services"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Cập nhật tour thất bại"); }
    finally { setSubmitting(false); }
  };

  if (!isHydrated || !isLoggedIn || !jwt) return null;

  return (
    <ServiceFormLayout
      icon={<MapPin className="h-5 w-5 text-white" />}
      iconClassName="from-emerald-500 to-emerald-600 shadow-emerald-500/20"
      title="Sửa tour du lịch"
      subtitle="Cập nhật thông tin tour của bạn."
      loading={loadingTour}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <ServiceFormSection icon={<Type className="h-4 w-4" />} title="Thông tin cơ bản">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tên tour <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Nhập tên tour..." className={inputCls.replace("text-sm", "text-base")} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Điểm đến</label>
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="VD: Hà Nội..." className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Thời gian (ngày)</label>
              <input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="VD: 3" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Giá (VND)</label>
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="VD: 1500000" className={inputCls} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"><span className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-zinc-500" />Danh mục</span></label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-500"></div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải danh mục...</span>
              </div>
            ) : (
              <div className="relative z-20 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <MultiSelectBox options={categoryTreeOptions} value={selectedCategoryDocumentIds} onChange={setSelectedCategoryDocumentIds} placeholder="Chọn một hoặc nhiều danh mục" />
              </div>
            )}
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<FileText className="h-4 w-4" />} title="Nội dung" bodyClassName="p-6"
          headerRight={<button type="button" onClick={() => setShowToolbar((v) => !v)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20">{showToolbar ? "Ẩn thanh công cụ" : "Hiển thị thanh công cụ"}</button>}
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800">
            <TiptapEditor value={content} onChange={setContent} showToolbar={showToolbar} />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Images className="h-4 w-4" />} title="Hình ảnh" bodyClassName="space-y-6 p-6">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="tour" entityDocumentId={documentId} category="thumbnail" multiple={false} label="Ảnh đại diện" />
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="tour" entityDocumentId={documentId} category="gallery" multiple={true} maxFiles={20} label="Thư viện ảnh" />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Calendar className="h-4 w-4" />} title="Lịch trình" bodyClassName="space-y-4 p-6"
          headerRight={<button type="button" onClick={addDay} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"><Plus className="h-3.5 w-3.5" />Thêm ngày</button>}
        >
          {itinerary.length === 0 && <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">Chưa có lịch trình. Nhấn &ldquo;Thêm ngày&rdquo; để bắt đầu.</p>}
          {itinerary.map((day, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3 dark:border-zinc-700 dark:bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <input value={day.label} onChange={(e) => updateDay(i, "label", e.target.value)} placeholder="Ngày 1" className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
                <input value={day.title} onChange={(e) => updateDay(i, "title", e.target.value)} placeholder="Tiêu đề ngày" className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
                <button type="button" onClick={() => removeDay(i)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea value={day.description} onChange={(e) => updateDay(i, "description", e.target.value)} placeholder="Mô tả chi tiết ngày..." rows={2} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
            </div>
          ))}
        </ServiceFormSection>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button type="button" onClick={() => router.push("/my-services")} className="rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 active:scale-95 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700">Hủy</button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>Đang cập nhật...</span> : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </ServiceFormLayout>
  );
}
