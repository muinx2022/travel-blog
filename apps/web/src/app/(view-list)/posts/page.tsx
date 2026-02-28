import Link from "next/link";
import {
  getHotelsWithPagination,
  getPostsWithPagination,
  getToursWithPagination,
  type Hotel,
  type Tour,
} from "@/lib/strapi";
import { InfinitePosts } from "@/components/infinite-posts";
import { CompactHotelCard } from "@/components/compact-hotel-card";
import { CompactTourCard } from "@/components/compact-tour-card";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

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
        <Link
          href={href}
          className="text-xs font-semibold text-sky-700 transition-colors hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
        >
          Xem tất cả
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default async function PostsPage() {
  const [data, hotelSuggestions, tourSuggestions] = await Promise.all([
    getPostsWithPagination(1, 12),
    getHotelsWithPagination(1, 4),
    getToursWithPagination(1, 4),
  ]);

  const posts = data?.data ?? [];
  const total = data?.meta?.pagination?.total ?? 0;
  const hotels = (hotelSuggestions?.data ?? []) as Hotel[];
  const tours = (tourSuggestions?.data ?? []) as Tour[];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <section className="reveal-up rounded-[28px] border border-zinc-100 bg-white p-8 shadow-sm">
        <nav className="mb-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-sky-700">Trang chủ</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">Bài viết</span>
        </nav>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight text-slate-900 dark:text-slate-100">
          Khám phá bài viết
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300">
          {total > 0 ? `${total} bài viết đang có sẵn` : "Chưa có bài viết nào."}
        </p>

        <div className="mt-7 grid gap-4 border-t border-zinc-200 pt-6 dark:border-slate-700 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5">
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-2xl text-slate-900 dark:text-slate-100">
              Danh sách bài viết
            </h2>
            {posts.length > 0 ? (
              <InfinitePosts
                initialPosts={posts}
                initialTotal={total}
                pageSize={12}
              />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-zinc-500 dark:text-zinc-400">Chưa có bài viết nào được đăng.</p>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {hotels.length > 0 && (
              <SidebarSection title="Khách sạn mới nhất" href="/hotels">
                {hotels.slice(0, 3).map((hotel) => (
                  <CompactHotelCard key={hotel.documentId} hotel={hotel} />
                ))}
              </SidebarSection>
            )}
            {tours.length > 0 && (
              <SidebarSection title="Tour mới nhất" href="/tours">
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
