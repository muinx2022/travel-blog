import Link from "next/link";
import { CategoryLocationFilter } from "@/components/category-location-filter";
import { CompactGuideCard } from "@/components/compact-guide-card";
import { getAllCategories, getTravelGuidesWithPagination } from "@/lib/strapi";

export const dynamic = "force-dynamic";

const guideTypes = [
  { value: "cam-nang", label: "Cẩm nang" },
  { value: "meo-du-lich", label: "Mẹo du lịch" },
  { value: "lich-trinh-goi-y", label: "Lịch trình" },
] as const;

function buildQuery(base: { cat?: string; type?: string; q?: string }, patch: Partial<{ cat: string; type: string; q: string }>) {
  const merged = {
    cat: patch.cat ?? base.cat ?? "",
    type: patch.type ?? base.type ?? "",
    q: patch.q ?? base.q ?? "",
  };
  const params = new URLSearchParams();
  if (merged.cat) params.set("cat", merged.cat);
  if (merged.type) params.set("type", merged.type);
  if (merged.q) params.set("q", merged.q);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export default async function GuidesPage({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string; type?: string; q?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const activeCategorySlug = query?.cat?.trim() || undefined;
  const activeGuideType = query?.type?.trim() || undefined;
  const activeKeyword = query?.q?.trim() || undefined;

  const [data, categories] = await Promise.all([
    getTravelGuidesWithPagination(1, 12, activeCategorySlug, activeGuideType, activeKeyword),
    getAllCategories(),
  ]);

  const guides = data?.data ?? [];
  const total = data?.meta?.pagination?.total ?? 0;
  const activeCategory = categories.find((cat) => cat.slug === activeCategorySlug);
  const rootCategories = categories
    .filter((item) => !item.parent?.documentId)
    .map((item) => ({ documentId: item.documentId, name: item.name, slug: item.slug }));

  const baseState = { cat: activeCategorySlug, type: activeGuideType, q: activeKeyword };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
      {/* Hero Section */}
      <section className="relative mb-8">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-teal-200/50 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-8 top-1/2 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl animate-pulse-glow delay-500" />
        
        <div className="reveal-up relative overflow-hidden rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl shadow-sky-100/50 backdrop-blur-xl md:p-10 mesh-gradient">
          <div className="relative z-10">
            <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="flex items-center gap-1 transition-colors hover:text-sky-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Trang chủ
              </Link>
              <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-slate-700">Cẩm nang</span>
            </nav>

            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-[1.2] tracking-tight text-slate-900 md:text-4xl">
              {activeCategory ? `Cẩm nang tại ${activeCategory.name}` : "Khám phá Cẩm nang du lịch"}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">
              {total > 0 ? `${total} bài cẩm nang đang có sẵn` : "Chưa có bài cẩm nang nào."}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/guides${buildQuery(baseState, { type: "" })}`}
                className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                  !activeGuideType
                    ? "border-sky-500 bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600"
                }`}
              >
                Tất cả
              </Link>
              {guideTypes.map((type) => (
                <Link
                  key={type.value}
                  href={`/guides${buildQuery(baseState, { type: type.value })}`}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                    activeGuideType === type.value
                      ? "border-teal-500 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-600"
                  }`}
                >
                  {type.label}
                </Link>
              ))}
            </div>

            <form action="/guides" method="get" className="mt-6 flex w-full max-w-2xl flex-wrap gap-3">
              {activeCategorySlug && <input type="hidden" name="cat" value={activeCategorySlug} />}
              {activeGuideType && <input type="hidden" name="type" value={activeGuideType} />}
              <div className="relative flex-1 min-w-[240px]">
                <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  defaultValue={activeKeyword ?? ""}
                  placeholder="Tìm theo tiêu đề, mô tả..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <button
                type="submit"
                className="h-11 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Tìm kiếm
              </button>
              {(activeKeyword || activeGuideType || activeCategorySlug) && (
                <Link
                  href="/guides"
                  className="inline-flex h-11 items-center gap-1 rounded-xl border-2 border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Xóa lọc
                </Link>
              )}
            </form>

            <div className="mt-6">
              <CategoryLocationFilter
                basePath="/guides"
                categories={rootCategories}
                activeCategorySlug={activeCategorySlug}
                defaultLabel="Chọn địa danh"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="mt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 md:text-3xl">
              Danh sách cẩm nang
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {guides.length > 0 ? `Hiển thị ${guides.length} bài cẩm nang` : "Không có kết quả"}
            </p>
          </div>
        </div>
        
        {guides.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide, index) => (
              <div 
                key={guide.documentId} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CompactGuideCard guide={guide} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="mt-3 text-slate-500">Không tìm thấy bài cẩm nang phù hợp.</p>
            <Link 
              href="/guides" 
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Xem tất cả cẩm nang
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
