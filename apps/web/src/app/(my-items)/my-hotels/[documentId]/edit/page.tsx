"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Type, FolderOpen, FileText, Images, AlertCircle, Star, BedDouble, Plus, Trash2 } from "lucide-react";
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
type RoomTypeInput = { name: string; description: string; price: string; available: boolean; amenities: string; videoUrl: string };

type EditHotelPayload = {
  documentId?: string; title?: string; content?: string; address?: string; city?: string; starRating?: number; videoUrl?: string;
  categories?: Array<{ documentId?: string }>;
  amenities?: Array<{ name: string }>;
  roomTypes?: Array<{ name: string; description?: string; price?: number; available?: boolean; amenities?: string; videoUrl?: string }>;
};

function MultiSelectBox({ options, value, onChange, placeholder = "Chọn danh mục" }: { options: CategoryTreeOption[]; value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  return <CategoryMultiSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />;
}

const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm transition-all duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-sky-400 dark:focus:ring-sky-400/10";

export default function EditMyHotelPage() {
  const router = useRouter();
  const params = useParams<{ documentId: string }>();
  const documentId = String(params?.documentId ?? "").trim();
  const { isLoggedIn, jwt, openLoginModal } = useAuth();
  const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [starRating, setStarRating] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showToolbar, setShowToolbar] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHotel, setLoadingHotel] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryDocumentIds, setSelectedCategoryDocumentIds] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<AmenityInput[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeInput[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    if (!documentId) { setError("Không tìm thấy khách sạn"); return; }
    let active = true;

    const loadHotel = async () => {
      setLoadingHotel(true);
      try {
        const res = await fetch(`/api/my-hotels-proxy?documentId=${encodeURIComponent(documentId)}`, { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { data?: EditHotelPayload; error?: string };
        if (!res.ok || !payload.data) throw new Error(payload.error || "Không tải được khách sạn");
        if (!active) return;
        setTitle(payload.data.title ?? "");
        setContent(payload.data.content ?? "");
        setAddress(payload.data.address ?? "");
        setCity(payload.data.city ?? "");
        setStarRating(payload.data.starRating != null ? String(payload.data.starRating) : "");
        setVideoUrl(payload.data.videoUrl ?? "");
        setSelectedCategoryDocumentIds((payload.data.categories ?? []).map((c) => String(c.documentId ?? "").trim()).filter(Boolean));
        setAmenities((payload.data.amenities ?? []).map((a) => ({ name: a.name })));
        setRoomTypes((payload.data.roomTypes ?? []).map((r) => ({ name: r.name, description: r.description ?? "", price: r.price != null ? String(r.price) : "", available: r.available ?? true, amenities: r.amenities ?? "", videoUrl: r.videoUrl ?? "" })));
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Không tải được khách sạn"); }
      finally { if (active) setLoadingHotel(false); }
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

    void Promise.all([loadHotel(), loadCategories()]);
    return () => { active = false; };
  }, [isHydrated, isLoggedIn, jwt, openLoginModal, router, documentId]);

  const addAmenity = () => setAmenities((p) => [...p, { name: "" }]);
  const removeAmenity = (i: number) => setAmenities((p) => p.filter((_, j) => j !== i));
  const updateAmenity = (i: number, val: string) => setAmenities((p) => p.map((a, j) => (j === i ? { name: val } : a)));
  const addRoom = () => setRoomTypes((p) => [...p, { name: "", description: "", price: "", available: true, amenities: "", videoUrl: "" }]);
  const removeRoom = (i: number) => setRoomTypes((p) => p.filter((_, j) => j !== i));
  const updateRoom = (i: number, field: keyof RoomTypeInput, val: unknown) => setRoomTypes((p) => p.map((r, j) => (j === i ? { ...r, [field]: val } : r)));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jwt) { openLoginModal(); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/my-hotels-proxy", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ documentId, title, content, categories: selectedCategoryDocumentIds, address, city, starRating: starRating ? Number(starRating) : undefined, videoUrl, amenities: amenities.filter((a) => a.name.trim()), roomTypes: roomTypes.filter((r) => r.name.trim()).map((r) => ({ name: r.name, description: r.description, price: r.price ? Number(r.price) : undefined, available: r.available, amenities: r.amenities, videoUrl: r.videoUrl })) }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Cập nhật khách sạn thất bại");
      router.push("/my-services"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Cập nhật khách sạn thất bại"); }
    finally { setSubmitting(false); }
  };

  if (!isHydrated || !isLoggedIn || !jwt) return null;

  return (
    <ServiceFormLayout
      icon={<Building2 className="h-5 w-5 text-white" />}
      iconClassName="from-sky-500 to-sky-600 shadow-sky-500/20"
      title="Sửa khách sạn"
      subtitle="Cập nhật thông tin khách sạn của bạn."
      loading={loadingHotel}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <ServiceFormSection icon={<Type className="h-4 w-4" />} title="Thông tin cơ bản">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tên khách sạn <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Nhập tên khách sạn..." className={inputCls.replace("text-sm", "text-base")} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Địa chỉ</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, tên đường..." className={inputCls} /></div>
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Thành phố</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="VD: Hà Nội" className={inputCls} /></div>
            <div className="space-y-2"><label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Số sao (1–5)</label><input type="number" min="1" max="5" value={starRating} onChange={(e) => setStarRating(e.target.value)} placeholder="VD: 4" className={inputCls} /></div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Video URL (YouTube)</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"><span className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-zinc-500" />Danh mục</span></label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50"><div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-sky-500"></div><span className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải danh mục...</span></div>
            ) : (
              <div className="relative z-20 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"><MultiSelectBox options={categoryTreeOptions} value={selectedCategoryDocumentIds} onChange={setSelectedCategoryDocumentIds} placeholder="Chọn một hoặc nhiều danh mục" /></div>
            )}
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<FileText className="h-4 w-4" />} title="Nội dung" bodyClassName="p-6"
          headerRight={<button type="button" onClick={() => setShowToolbar((v) => !v)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/20">{showToolbar ? "Ẩn thanh công cụ" : "Hiển thị thanh công cụ"}</button>}
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm focus-within:ring-4 focus-within:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800">
            <TiptapEditor value={content} onChange={setContent} showToolbar={showToolbar} />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Images className="h-4 w-4" />} title="Hình ảnh" bodyClassName="space-y-6 p-6">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="hotel" entityDocumentId={documentId} category="thumbnail" multiple={false} label="Ảnh đại diện" />
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <EntityMediaManager entityType="hotel" entityDocumentId={documentId} category="gallery" multiple={true} maxFiles={20} label="Thư viện ảnh" />
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<Star className="h-4 w-4" />} title="Tiện ích khách sạn" bodyClassName="space-y-4 p-6"
          headerRight={<button type="button" onClick={addAmenity} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"><Plus className="h-3.5 w-3.5" />Thêm</button>}
        >
          {amenities.length === 0 && <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">Chưa có tiện ích nào.</p>}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {amenities.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={a.name} onChange={(e) => updateAmenity(i, e.target.value)} placeholder="Tên tiện ích" className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
                <button type="button" onClick={() => removeAmenity(i)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </ServiceFormSection>

        <ServiceFormSection icon={<BedDouble className="h-4 w-4" />} title="Loại phòng" bodyClassName="space-y-4 p-6"
          headerRight={<button type="button" onClick={addRoom} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"><Plus className="h-3.5 w-3.5" />Thêm loại phòng</button>}
        >
          {roomTypes.length === 0 && <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">Chưa có loại phòng nào.</p>}
          {roomTypes.map((rt, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3 dark:border-zinc-700 dark:bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <input value={rt.name} onChange={(e) => updateRoom(i, "name", e.target.value)} placeholder="Tên loại phòng" className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
                <button type="button" onClick={() => removeRoom(i)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea value={rt.description} onChange={(e) => updateRoom(i, "description", e.target.value)} placeholder="Mô tả loại phòng" rows={2} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input type="number" min="0" value={rt.price} onChange={(e) => updateRoom(i, "price", e.target.value)} placeholder="Giá/đêm (VND)" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
                <div className="flex items-center gap-2"><input type="checkbox" id={`avail-${i}`} checked={rt.available} onChange={(e) => updateRoom(i, "available", e.target.checked)} className="h-4 w-4 accent-sky-500" /><label htmlFor={`avail-${i}`} className="text-sm text-zinc-700 dark:text-zinc-300">Còn phòng</label></div>
                <input value={rt.videoUrl} onChange={(e) => updateRoom(i, "videoUrl", e.target.value)} placeholder="Video URL" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
              </div>
              <input value={rt.amenities} onChange={(e) => updateRoom(i, "amenities", e.target.value)} placeholder="Tiện ích phòng (VD: TV, Điều hòa)" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 dark:border-zinc-700 dark:bg-zinc-800" />
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
          <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:from-sky-700 hover:to-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>Đang cập nhật...</span> : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </ServiceFormLayout>
  );
}
