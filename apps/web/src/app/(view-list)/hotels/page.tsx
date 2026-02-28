import Link from "next/link";
import {
  getAllCategories,
  getHotelsWithPagination,
  getPostsWithPagination,
  getToursWithPagination,
  type Hotel,
  type Post,
  type Tour,
} from "@/lib/strapi";
import { CompactTourCard } from "@/components/compact-tour-card";
import { CategoryLocationFilter } from "@/components/category-location-filter";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <span className="text-amber-500">
      {"\u2605".repeat(rating)}
      {"\u2606".repeat(5 - rating)}
    </span>
  );
}

function getLowestPrice(hotel: Hotel): number | null {
  const prices = (hotel.roomTypes ?? [])
    .map((rt) => rt.price)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const formattedDate = hotel.publishedAt
    ? new Date(hotel.publishedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const lowestPrice = getLowestPrice(hotel);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100/50 hover:border-sky-200">
      {hotel.thumbnail?.url && (
        <div className="mb-4 overflow-hidden rounded-xl">
          <img
            src={hotel.thumbnail.url}
            alt={hotel.title}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <StarRating rating={hotel.starRating} />
        {hotel.city && <span className="text-sm text-slate-500">📍 {hotel.city}</span>}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(hotel.categories ?? []).map((cat) => (
          <Link
            key={cat.documentId}
            href={`/c/${cat.slug}`}
            className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <Link
        href={`/hotels/${hotel.slug}--${hotel.documentId}`}
        className="block font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-slate-900 transition-colors group-hover:text-sky-600"
      >
        {hotel.title}
      </Link>

      {lowestPrice && (
        <p className="mt-2 text-sm font-semibold text-emerald-600">
          Từ {lowestPrice.toLocaleString("vi-VN")} VND/đêm
        </p>
      )}

      {hotel.excerpt && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {hotel.excerpt}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        {formattedDate && <span className="text-xs text-slate-400">{formattedDate}</span>}
        <Link
          href={`/hotels/${hotel.slug}--${hotel.documentId}`}
          className="flex items-center gap-1 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700"
        >
          Xem chi tiết
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

function SidebarSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-100/50 transition-all hover:shadow-xl">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-slate-900">
          {title}
        </h3>
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700">
          Xem tất cả
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SidebarPostItem({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}--${post.documentId}`}
      className="block rounded-xl border border-slate-100 p-3 transition-all hover:border-sky-200 hover:bg-sky-50/50"
    >
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
        {post.title}
      </p>
      <p className="mt-1 text-xs text-sky-600">Đọc bài viết</p>
    </Link>
  );
}

function collectTopCategories(hotels: Hotel[]) {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const hotel of hotels) {
    for (const cat of hotel.categories ?? []) {
      if (!cat.slug) continue;
      const current = map.get(cat.slug);
      if (current) {
        current.count += 1;
      } else {
        map.set(cat.slug, { slug: cat.slug, name: cat.name, count: 1 });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export default async function HotelsPage({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const activeCategorySlug = query?.cat?.trim() || undefined;

  const [data, categories] = await Promise.all([
    getHotelsWithPagination(1, 12, activeCategorySlug),
    getAllCategories(),
  ]);

  const hotels = data?.data ?? [];
  const total = data?.meta?.pagination?.total ?? 0;

  const topCategories = collectTopCategories(hotels);

  const [postGroups, tourSuggestions] = await Promise.all([
    Promise.all(
      topCategories.map(async (cat) => {
        const posts = await getPostsWithPagination(1, 3, cat.slug);
        return {
          category: cat,
          posts: posts?.data ?? [],
        };
      }),
    ),
    getToursWithPagination(1, 4, topCategories[0]?.slug),
  ]);

  const tours = (tourSuggestions?.data ?? []) as Tour[];
  const rootCategories = categories
    .filter((item) => !item.parent?.documentId)
    .map((item) => ({ documentId: item.documentId, name: item.name, slug: item.slug }));
  const activeCategory = categories.find((cat) => cat.slug === activeCategorySlug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
      {/* Hero Section */}
      <section className="relative mb-8">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-rose-200/50 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-8 top-1/2 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl animate-pulse-glow delay-500" />
        
        <div className="reveal-up relative overflow-hidden rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl shadow-rose-100/50 backdrop-blur-xl md:p-10 mesh-gradient">
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
              <span className="font-medium text-slate-700">
                {activeCategory ? activeCategory.name : "Khách sạn"}
              </span>
            </nav>

            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-[1.2] tracking-tight text-slate-900 md:text-4xl">
              {activeCategory ? `Khách sạn tại ${activeCategory.name}` : "Khám phá Khách sạn"}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">
              {total > 0 ? `${total} khách sạn đang có sẵn` : "Chưa có khách sạn nào."}
            </p>

            <div className="mt-6">
              <CategoryLocationFilter
                basePath="/hotels"
                categories={rootCategories}
                activeCategorySlug={activeCategorySlug}
                defaultLabel="Chọn địa danh"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hotels Grid & Sidebar */}
      <section className="mt-8">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 md:text-3xl">
            Danh sách khách sạn
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {hotels.length > 0 ? `Hiển thị ${hotels.length} khách sạn` : "Không có kết quả"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            {hotels.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {hotels.map((hotel, index) => (
                  <div 
                    key={hotel.documentId} 
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <HotelCard hotel={hotel} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-3 text-slate-500">Chưa có khách sạn nào được đăng.</p>
              </div>
            )}
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {postGroups.map(({ category, posts }) => (
              <SidebarSection key={category.slug} title={`Bài viết: ${category.name}`} href={`/c/${category.slug}`}>
                {posts.length > 0 ? (
                  posts.map((post) => <SidebarPostItem key={post.documentId} post={post} />)
                ) : (
                  <p className="text-sm text-slate-400">Chưa có bài viết cùng danh mục.</p>
                )}
              </SidebarSection>
            ))}

            {tours.length > 0 && (
              <SidebarSection title="Tour gợi ý" href="/tours">
                {tours.slice(0, 3).map((tour) => (
                  <CompactTourCard key={tour.documentId} tour={tour} />
                ))}
              </SidebarSection>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
