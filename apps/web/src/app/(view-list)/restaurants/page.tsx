import Link from "next/link";
import {
  getAllCategories,
  getPostsWithPagination,
  getRestaurantsWithPagination,
  getToursWithPagination,
  type Post,
  type Restaurant,
  type Tour,
} from "@/lib/strapi";
import { CompactTourCard } from "@/components/compact-tour-card";
import { CategoryLocationFilter } from "@/components/category-location-filter";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const formattedDate = restaurant.publishedAt
    ? new Date(restaurant.publishedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <article className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      {restaurant.thumbnail?.url && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img
            src={restaurant.thumbnail.url}
            alt={restaurant.title}
            className="h-48 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      <div className="mb-2 flex flex-wrap gap-1.5">
        {(restaurant.categories ?? []).map((cat) => (
          <Link
            key={cat.documentId}
            href={`/c/${cat.slug}`}
            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <Link
        href={`/restaurants/${restaurant.slug}--${restaurant.documentId}`}
        className="block text-xl font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400"
      >
        {restaurant.title}
      </Link>

      <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        {restaurant.cuisineType && <span>🍽 {restaurant.cuisineType}</span>}
        {restaurant.city && <span>📍 {restaurant.city}</span>}
        {restaurant.priceRange && <span>💰 {restaurant.priceRange}</span>}
      </div>

      {restaurant.excerpt && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {restaurant.excerpt}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        {formattedDate && <span className="text-xs text-zinc-400 dark:text-zinc-500">{formattedDate}</span>}
        <Link
          href={`/restaurants/${restaurant.slug}--${restaurant.documentId}`}
          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Xem chi tiết -&gt;
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
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-slate-700">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
          {title}
        </h3>
        <Link href={href} className="text-xs font-semibold text-sky-700 transition-colors hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300">
          Xem tất cả
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SidebarPostItem({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}--${post.documentId}`}
      className="block rounded-lg p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
    >
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 dark:text-zinc-200">
        {post.title}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Đọc bài viết liên quan</p>
    </Link>
  );
}

function collectTopCategories(restaurants: Restaurant[]) {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const restaurant of restaurants) {
    for (const cat of restaurant.categories ?? []) {
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

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const activeCategorySlug = query?.cat?.trim() || undefined;

  const [data, categories] = await Promise.all([
    getRestaurantsWithPagination(1, 12, activeCategorySlug),
    getAllCategories(),
  ]);

  const restaurants = data?.data ?? [];
  const total = data?.meta?.pagination?.total ?? 0;
  const topCategories = collectTopCategories(restaurants);

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
    getToursWithPagination(1, 4, activeCategorySlug ?? topCategories[0]?.slug),
  ]);

  const tours = (tourSuggestions?.data ?? []) as Tour[];
  const rootCategories = categories
    .filter((item) => !item.parent?.documentId)
    .map((item) => ({ documentId: item.documentId, name: item.name, slug: item.slug }));
  const activeCategory = categories.find((cat) => cat.slug === activeCategorySlug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <section className="reveal-up rounded-[28px] border border-zinc-100 bg-white p-8 shadow-sm">
        <nav className="mb-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-sky-700">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">
            {activeCategory ? activeCategory.name : "Restaurants"}
          </span>
        </nav>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight text-slate-900 dark:text-slate-100">
          {activeCategory ? `Nhà hàng tại ${activeCategory.name}` : "Khám phá Restaurants"}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300">
          {total > 0 ? `${total} nhà hàng đang có sẵn` : "Chưa có nhà hàng nào."}
        </p>
        <CategoryLocationFilter
          basePath="/restaurants"
          categories={rootCategories}
          activeCategorySlug={activeCategorySlug}
          defaultLabel="Chọn địa danh"
        />

        <div className="mt-7 grid gap-4 border-t border-zinc-200 pt-6 dark:border-slate-700 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5">
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-2xl text-slate-900 dark:text-slate-100">
              Danh sách nhà hàng
            </h2>
            {restaurants.length > 0 ? (
              <div className="grid gap-5">
                {restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.documentId} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-zinc-500 dark:text-zinc-400">Chưa có nhà hàng nào được đăng.</p>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {postGroups.map(({ category, posts }) => (
              <SidebarSection key={category.slug} title={`Bài viết: ${category.name}`} href={`/c/${category.slug}`}>
                {posts.length > 0 ? (
                  posts.map((post) => <SidebarPostItem key={post.documentId} post={post} />)
                ) : (
                  <p className="px-2 py-1 text-sm text-zinc-500 dark:text-zinc-400">Chưa có bài viết cùng danh mục.</p>
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

