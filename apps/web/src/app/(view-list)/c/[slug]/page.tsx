import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategoryBySlug,
  getPostsWithPagination,
  getToursWithPagination,
  getHotelsWithPagination,
} from "@/lib/strapi";
import { InfinitePosts } from "@/components/infinite-posts";
import { RichTextContent } from "@/components/rich-text-content";
import { CompactTourCard } from "@/components/compact-tour-card";
import { CompactHotelCard } from "@/components/compact-hotel-card";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [postsData, toursData, hotelsData] = await Promise.all([
    getPostsWithPagination(1, 10, slug),
    getToursWithPagination(1, 6, slug),
    getHotelsWithPagination(1, 6, slug),
  ]);

  const posts = postsData?.data || [];
  const total = postsData?.meta?.pagination?.total || 0;
  const tours = toursData?.data ?? [];
  const hotels = hotelsData?.data ?? [];

  return (
    <div>
      <section className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-8">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-8 top-1/2 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl animate-pulse-glow delay-500" />
        
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
              <span className="font-medium text-slate-700">{category.name}</span>
            </nav>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-[1.2] tracking-tight text-slate-900 md:text-4xl">
              {category.name}
            </h1>
            {category.description && (
              <div className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                {typeof category.description === "string" ? (
                  <RichTextContent html={category.description} />
                ) : (
                  <p>Description format not supported yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {category.children && category.children.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 md:text-3xl">
              Khám phá thêm
            </h2>
            <p className="mt-1 text-sm text-slate-500">Các địa điểm liên quan trong khu vực</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {category.children.map((child, index) => (
              <Link
                key={child.documentId}
                href={`/c/${child.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100/50 hover:border-sky-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-cyan-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 flex min-h-[80px] flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-600 transition-transform duration-300 group-hover:scale-110">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all duration-300 group-hover:bg-sky-100 group-hover:text-sky-600">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="font-[family-name:var(--font-playfair)] text-base font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                      {child.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 transition-colors group-hover:text-sky-500">Xem bài viết</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 md:text-3xl">
            Bài viết trong danh mục
          </h2>
          <p className="mt-1 text-sm text-slate-500">Khám phá những trải nghiệm và kinh nghiệm tại {category.name}</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <InfinitePosts initialPosts={posts} initialTotal={total} categorySlug={slug} />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {tours.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-100/50 transition-all hover:shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-slate-900">
                    Tours tại {category.name}
                  </h3>
                  <Link href="/tours" className="group flex items-center gap-1 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700">
                    Xem tất cả
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="space-y-4">
                  {tours.slice(0, 4).map((tour) => (
                    <CompactTourCard key={tour.documentId} tour={tour} />
                  ))}
                </div>
              </div>
            )}

            {hotels.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-100/50 transition-all hover:shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-slate-900">
                    Khách sạn tại {category.name}
                  </h3>
                  <Link href="/hotels" className="group flex items-center gap-1 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700">
                    Xem tất cả
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="space-y-4">
                  {hotels.slice(0, 4).map((hotel) => (
                    <CompactHotelCard key={hotel.documentId} hotel={hotel} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
