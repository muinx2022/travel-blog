import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommentsForTarget, getRestaurantByDocumentId } from "@/lib/strapi";
import { RichTextContent } from "@/components/rich-text-content";
import { GenericComments } from "@/components/generic-comments";
import { PostActions } from "@/components/post-actions";

export const dynamic = "force-dynamic";

type RestaurantPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = await params;
  const documentId = id.includes("--") ? id.split("--").pop() : id;

  if (!documentId) {
    notFound();
  }

  const restaurant = await getRestaurantByDocumentId(documentId);
  if (!restaurant) {
    notFound();
  }

  const comments = await getCommentsForTarget("restaurant", restaurant.documentId);
  const images = restaurant.images ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <article className="reveal-up rounded-[28px] border border-zinc-100 bg-white p-8 shadow-sm">
        <nav className="mb-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-sky-700">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/restaurants" className="hover:text-sky-700">
            Restaurants
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">{restaurant.title}</span>
        </nav>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight text-slate-900 dark:text-slate-100">
          {restaurant.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          {restaurant.cuisineType && <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-slate-800">🍽 {restaurant.cuisineType}</span>}
          {restaurant.city && <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-slate-800">📍 {restaurant.city}</span>}
          {restaurant.priceRange && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
              {restaurant.priceRange}
            </span>
          )}
          <span>{comments.length} bình luận</span>
        </div>

        {(restaurant.categories ?? []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(restaurant.categories ?? []).map((cat) => (
              <Link
                key={cat.documentId}
                href={`/c/${cat.slug}`}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-7 grid gap-4 border-t border-zinc-200 pt-6 dark:border-slate-700 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5">
          <section className="space-y-6">
            {restaurant.thumbnail?.url && (
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-slate-700">
                <img src={restaurant.thumbnail.url} alt={restaurant.title} className="h-72 w-full object-cover md:h-96" />
              </div>
            )}

            {restaurant.excerpt && (
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">{restaurant.excerpt}</p>
            )}

            {restaurant.content && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <RichTextContent html={restaurant.content} className="richtext-content text-slate-700 dark:text-slate-200" />
              </div>
            )}

            {images.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Thư viện ảnh</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((img) => (
                    <div key={img.id} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
                      <img src={img.url} alt={img.name} className="h-32 w-full object-cover transition-transform hover:scale-105" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="border-t border-zinc-200 pt-6 dark:border-slate-700">
              <PostActions
                targetType="restaurant"
                targetDocumentId={restaurant.documentId}
                targetTitle={restaurant.title}
              />
            </section>

            <section className="border-t border-zinc-200 pt-6 dark:border-slate-700">
              <h2 className="mb-5 text-2xl font-semibold text-slate-900 dark:text-slate-100">Bình luận</h2>
              <GenericComments
                targetType={"restaurant"}
                targetDocumentId={restaurant.documentId}
                initialComments={comments}
              />
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                Thông tin nhanh
              </h3>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {restaurant.cuisineType && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Loại món:</span> {restaurant.cuisineType}
                  </p>
                )}
                {restaurant.city && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Thành phố:</span> {restaurant.city}
                  </p>
                )}
                {restaurant.address && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Địa chỉ:</span> {restaurant.address}
                  </p>
                )}
                {restaurant.priceRange && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Tầm giá:</span> {restaurant.priceRange}
                  </p>
                )}
                <p>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Bình luận:</span> {comments.length}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </article>
    </div>
  );
}

