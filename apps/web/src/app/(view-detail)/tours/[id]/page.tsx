import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCommentsForTarget,
  getPostsByTags,
  getTravelGuidesByTags,
  getTagsByTour,
  getTourByDocumentId,
} from "@/lib/strapi";
import { RichTextContent } from "@/components/rich-text-content";
import { GenericComments } from "@/components/generic-comments";
import { PostActions } from "@/components/post-actions";

export const dynamic = "force-dynamic";

type TourPageProps = {
  params: Promise<{ id: string }>;
};

function formatPublishedDate(input?: string) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function TourPage({ params }: TourPageProps) {
  const { id } = await params;
  const documentId = id.includes("--") ? id.split("--").pop() : id;

  if (!documentId) {
    notFound();
  }

  const tour = await getTourByDocumentId(documentId);
  if (!tour) {
    notFound();
  }

  const comments = await getCommentsForTarget("tour", tour.documentId);
  const tourTags = await getTagsByTour(tour.slug);
  const relatedPosts = await getPostsByTags(
    tourTags.map((tag) => tag.slug),
    5,
  );
  const relatedGuides = await getTravelGuidesByTags(
    tourTags.map((tag) => tag.slug),
    5,
  );

  const itinerary = tour.itinerary ?? [];
  const publishedDate = formatPublishedDate(tour.publishedAt);
  const priceLabel = tour.price != null ? `${tour.price.toLocaleString("vi-VN")} VND` : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <article className="reveal-up rounded-[28px] border border-zinc-100 bg-white p-8 shadow-sm">
        <nav className="mb-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-sky-700">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/tours" className="hover:text-sky-700">
            Tours
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">{tour.title}</span>
        </nav>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight text-slate-900 dark:text-slate-100">
          {tour.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          {tour.destination && <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-slate-800">📍 {tour.destination}</span>}
          {tour.duration != null && <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-slate-800">🗓 {tour.duration} ngày</span>}
          {priceLabel && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
              {priceLabel}
            </span>
          )}
          {publishedDate && <span>{publishedDate}</span>}
          <span>{comments.length} bình luận</span>
        </div>

        {(tour.categories ?? []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(tour.categories ?? []).map((cat) => (
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
            {tour.thumbnail?.url && (
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-slate-700">
                <img src={tour.thumbnail.url} alt={tour.title} className="h-72 w-full object-cover md:h-96" />
              </div>
            )}

            {tour.excerpt && (
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">{tour.excerpt}</p>
            )}

            {tour.content && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <RichTextContent html={tour.content} className="richtext-content text-slate-700 dark:text-slate-200" />
              </div>
            )}

            {itinerary.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Lịch trình</h2>
                {itinerary.map((day, index) => (
                  <div key={index} className="rounded-xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-zinc-200 px-4 py-3 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {day.label}: {day.title}
                      </h3>
                    </div>
                    {day.description && (
                      <div className="p-4">
                        <RichTextContent html={day.description} className="richtext-content text-sm text-zinc-600 dark:text-zinc-300" />
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}

            <section className="border-t border-zinc-200 pt-6 dark:border-slate-700">
              <PostActions
                targetType="tour"
                targetDocumentId={tour.documentId}
                targetTitle={tour.title}
              />
            </section>

            <section className="border-t border-zinc-200 pt-6 dark:border-slate-700">
              <h2 className="mb-5 text-2xl font-semibold text-slate-900 dark:text-slate-100">Bình luận</h2>
              <GenericComments
                targetType={"tour"}
                targetDocumentId={tour.documentId}
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
                {tour.destination && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Điểm đến:</span> {tour.destination}
                  </p>
                )}
                {tour.duration != null && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Thời lượng:</span> {tour.duration} ngày
                  </p>
                )}
                {priceLabel && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Giá:</span> {priceLabel}
                  </p>
                )}
                <p>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Bình luận:</span> {comments.length}
                </p>
              </div>
            </section>

            {relatedPosts.length > 0 && (
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                  Bài viết liên quan
                </h3>
                <div className="space-y-3">
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.documentId}
                      href={`/posts/${post.slug}--${post.documentId}`}
                      className="block rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-zinc-200 dark:hover:border-sky-700 dark:hover:bg-slate-800"
                    >
                      <p className="line-clamp-2 font-medium">{post.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {relatedGuides.length > 0 && (
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                  Cẩm nang liên quan
                </h3>
                <div className="space-y-3">
                  {relatedGuides.map((guide) => (
                    <Link
                      key={guide.documentId}
                      href={`/guides/${guide.slug}--${guide.documentId}`}
                      className="block rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-zinc-200 dark:hover:border-sky-700 dark:hover:bg-slate-800"
                    >
                      <p className="line-clamp-2 font-medium">{guide.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
}

