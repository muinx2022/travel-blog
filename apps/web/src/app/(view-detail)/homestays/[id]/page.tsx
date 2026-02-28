import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommentsForTarget, getHomestayByDocumentId } from "@/lib/strapi";
import { RichTextContent } from "@/components/rich-text-content";
import { GenericComments } from "@/components/generic-comments";
import { PostActions } from "@/components/post-actions";

export const dynamic = "force-dynamic";

type HomestayPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HomestayPage({ params }: HomestayPageProps) {
  const { id } = await params;
  const documentId = id.includes("--") ? id.split("--").pop() : id;

  if (!documentId) {
    notFound();
  }

  const homestay = await getHomestayByDocumentId(documentId);
  if (!homestay) {
    notFound();
  }

  const comments = await getCommentsForTarget("homestay", homestay.documentId);
  const amenities = homestay.amenities ?? [];
  const images = homestay.images ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <article className="reveal-up rounded-[28px] border border-zinc-100 bg-white p-8 shadow-sm">
        <nav className="mb-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-sky-700">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/homestays" className="hover:text-sky-700">
            Homestays
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">{homestay.title}</span>
        </nav>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight text-slate-900 dark:text-slate-100">
          {homestay.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          {homestay.city && <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-slate-800">📍 {homestay.city}</span>}
          {homestay.priceRange && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
              {homestay.priceRange}
            </span>
          )}
          <span>{comments.length} bình luận</span>
        </div>

        {(homestay.categories ?? []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(homestay.categories ?? []).map((cat) => (
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
            {homestay.thumbnail?.url && (
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-slate-700">
                <img src={homestay.thumbnail.url} alt={homestay.title} className="h-72 w-full object-cover md:h-96" />
              </div>
            )}

            {homestay.excerpt && (
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">{homestay.excerpt}</p>
            )}

            {homestay.content && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <RichTextContent html={homestay.content} className="richtext-content text-slate-700 dark:text-slate-200" />
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
              <PostActions targetType="homestay" targetDocumentId={homestay.documentId} targetTitle={homestay.title} />
            </section>

            <section className="border-t border-zinc-200 pt-6 dark:border-slate-700">
              <h2 className="mb-5 text-2xl font-semibold text-slate-900 dark:text-slate-100">Bình luận</h2>
              <GenericComments targetType={"homestay"} targetDocumentId={homestay.documentId} initialComments={comments} />
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                Thông tin nhanh
              </h3>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {homestay.city && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Thành phố:</span> {homestay.city}
                  </p>
                )}
                {homestay.address && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Địa chỉ:</span> {homestay.address}
                  </p>
                )}
                {homestay.priceRange && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Tầm giá:</span> {homestay.priceRange}
                  </p>
                )}
                <p>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Bình luận:</span> {comments.length}
                </p>
              </div>
            </section>

            {amenities.length > 0 && (
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                  Tiện ích
                </h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300"
                    >
                      {amenity.name}
                    </span>
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
