import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPostsByTags,
  getTagsByTravelGuide,
  getToursByTags,
  getTravelGuideByDocumentId,
  getTravelGuidesByTags,
} from "@/lib/strapi";
import { RichTextContent } from "@/components/rich-text-content";
import { CompactGuideCard } from "@/components/compact-guide-card";

export const dynamic = "force-dynamic";

type GuidePageProps = {
  params: Promise<{ id: string }>;
};

const guideTypeLabel: Record<string, string> = {
  "cam-nang": "Cẩm nang du lịch",
  "meo-du-lich": "Mẹo du lịch",
  "lich-trinh-goi-y": "Lịch trình gợi ý",
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

export default async function GuidePage({ params }: GuidePageProps) {
  const { id } = await params;
  const documentId = id.includes("--") ? id.split("--").pop() : id;

  if (!documentId) {
    notFound();
  }

  const guide = await getTravelGuideByDocumentId(documentId);

  if (!guide) {
    notFound();
  }

  const tags = await getTagsByTravelGuide(guide.slug);
  const tagSlugs = tags.map((tag) => tag.slug);

  const [relatedPosts, relatedTours, relatedGuidesByTag] = await Promise.all([
    getPostsByTags(tagSlugs, 4),
    getToursByTags(tagSlugs, 4),
    getTravelGuidesByTags(tagSlugs, 4),
  ]);

  const relatedGuides = relatedGuidesByTag
    .filter((g) => g.documentId !== guide.documentId)
    .slice(0, 3);

  const categorySlug = guide.categories?.[0]?.slug;
  const publishedDate = formatPublishedDate(guide.publishedAt);
  const typeLabel = guideTypeLabel[guide.guideType ?? "cam-nang"] ?? "Hướng dẫn";

  return (
    <div className="pb-12 pt-4">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            <Link href="/" className="transition-colors hover:text-slate-800">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/guides" className="transition-colors hover:text-slate-800">
              Cẩm nang
            </Link>
            {categorySlug && (
              <>
                <span className="text-slate-300">/</span>
                <Link href={`/c/${categorySlug}`} className="transition-colors hover:text-slate-800">
                  {guide.categories?.[0]?.name}
                </Link>
              </>
            )}
            <span className="text-slate-300">/</span>
            <span className="max-w-full truncate text-slate-700">{typeLabel}</span>
          </nav>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
              {typeLabel}
            </span>
            {(guide.categories ?? []).map((cat) => (
              <Link
                key={cat.documentId}
                href={`/c/${cat.slug}`}
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
            {guide.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {publishedDate && <span>Đăng ngày: {publishedDate}</span>}
            {guide.author?.username && <span>Tác giả: {guide.author.username}</span>}
          </div>

          {guide.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{guide.excerpt}</p>
          )}

          {guide.thumbnail?.url && (
            <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
              <img
                src={guide.thumbnail.url}
                alt={guide.title}
                className="h-64 w-full object-cover md:h-80"
              />
            </div>
          )}

          <div className="mt-8 grid gap-8 border-t border-slate-200 pt-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="space-y-6">
              {guide.content && (
                <RichTextContent
                  html={guide.content}
                  className="richtext-content text-slate-700"
                />
              )}

              {tags.length > 0 && (
                <div className="border-t border-slate-200 pt-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link
                        key={tag.documentId}
                        href={`/tag/${tag.slug}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <aside className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="space-y-4 lg:sticky lg:top-24">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
                    Thông tin
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Loại:</span>{" "}
                      {typeLabel}
                    </p>
                    {guide.author?.username && (
                      <p>
                        <span className="font-semibold text-slate-900">Tác giả:</span>{" "}
                        {guide.author.username}
                      </p>
                    )}
                    {(guide.categories ?? []).length > 0 && (
                      <p>
                        <span className="font-semibold text-slate-900">Danh mục:</span>{" "}
                        {guide.categories!.map((c) => c.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {relatedGuides.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Cẩm nang cùng tag
                    </h3>
                    <div className="space-y-3">
                      {relatedGuides.map((g) => (
                        <CompactGuideCard key={g.documentId} guide={g} />
                      ))}
                    </div>
                  </div>
                )}

                {relatedTours.length > 0 && (
                  <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                      Tour liên quan
                    </h3>
                    <div className="space-y-3">
                      {relatedTours.map((tour) => (
                        <Link
                          key={tour.documentId}
                          href={`/tours/${tour.slug}--${tour.documentId}`}
                          className="block rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-zinc-200 dark:hover:border-sky-700 dark:hover:bg-slate-800"
                        >
                          <p className="line-clamp-2 font-medium">{tour.title}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

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
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
