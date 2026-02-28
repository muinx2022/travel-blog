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
import { CompactHotelCard } from "@/components/compact-hotel-card";
import { CategoryLocationFilter } from "@/components/category-location-filter";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function TourCard({ tour }: { tour: Tour }) {
  const formattedDate = tour.publishedAt
    ? new Date(tour.publishedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100/50 hover:border-sky-200">
      {tour.thumbnail?.url && (
        <div className="mb-4 overflow-hidden rounded-xl">
          <img
            src={tour.thumbnail.url}
            alt={tour.title}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(tour.categories ?? []).map((cat) => (
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
        href={`/tours/${tour.slug}--${tour.documentId}`}
        className="block font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-slate-900 transition-colors group-hover:text-sky-600"
      >
        {tour.title}
      </Link>

      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
        {tour.destination && (
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {tour.destination}
          </span>
        )}
        {tour.duration != null && (
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {tour.duration} ngày
          </span>
        )}
        {tour.price != null && (
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {tour.price.toLocaleString("vi-VN")} VND
          </span>
        )}
      </div>

      {tour.excerpt && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {tour.excerpt}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        {formattedDate && <span className="text-xs text-slate-400">{formattedDate}</span>}
        <Link
          href={`/tours/${tour.slug}--${tour.documentId}`}
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

function collectTopCategories(tours: Tour[]) {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const tour of tours) {
    for (const cat of tour.categories ?? []) {
      if (!cat.slug) continue;
      const current = map.get(cat.slug);
      if (current) current.count += 1;
      else map.set(cat.slug, { slug: cat.slug, name: cat.name, count: 1 });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export default async function ToursPage({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const activeCategorySlug = query?.cat?.trim() || undefined;

  const [data, categories] = await Promise.all([
    getToursWithPagination(1, 12, activeCategorySlug),
    getAllCategories(),
  ]);

  const tours = data?.data ?? [];
  const total = data?.meta?.pagination?.total ?? 0;
  const topCategories = collectTopCategories(tours);

  const [postGroups, hotelSuggestions] = await Promise.all([
    Promise.all(
      topCategories.map(async (cat) => {
        const posts = await getPostsWithPagination(1, 3, cat.slug);
        return {
          category: cat,
          posts: posts?.data ?? [],
        };
      }),
    ),
    getHotelsWithPagination(1, 4, activeCategorySlug ?? topCategories[0]?.slug),
  ]);

  const hotels = (hotelSuggestions?.data ?? []) as Hotel[];
  const rootCategories = categories
    .filter((item) => !item.parent?.documentId)
    .map((item) => ({ documentId: item.documentId, name: item.name, slug: item.slug }));
  const activeCategory = categories.find((cat) => cat.slug === activeCategorySlug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
      {/* Hero Section */}
      <section className="relative mb-8">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-emerald-200/50 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-8 top-1/2 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl animate-pulse-glow delay-500" />
        
        <div className="reveal-up relative overflow-hidden rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl shadow-emerald-100/50 backdrop-blur-xl md:p-10 mesh-gradient">
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
                {activeCategory ? activeCategory.name : "Tour"}
              </span>
            </nav>

            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-[1.2] tracking-tight text-slate-900 md:text-4xl">
              {activeCategory ? `Tour tại ${activeCategory.name}` : "Khám phá Tour"}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">
              {total > 0 ? `${total} tour đang có sẵn` : "Chưa có tour nào."}
            </p>

            <div className="mt-6">
              <CategoryLocationFilter
                basePath="/tours"
                categories={rootCategories}
                activeCategorySlug={activeCategorySlug}
                defaultLabel="Chọn địa danh"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tours Grid & Sidebar */}
      <section className="mt-8">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 md:text-3xl">
            Danh sách tour
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {tours.length > 0 ? `Hiển thị ${tours.length} tour` : "Không có kết quả"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            {tours.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {tours.map((tour, index) => (
                  <div 
                    key={tour.documentId} 
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TourCard tour={tour} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-3 text-slate-500">Chưa có tour nào được đăng.</p>
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

            {hotels.length > 0 && (
              <SidebarSection title="Khách sạn gợi ý" href="/hotels">
                {hotels.slice(0, 3).map((hotel) => (
                  <CompactHotelCard key={hotel.documentId} hotel={hotel} />
                ))}
              </SidebarSection>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
