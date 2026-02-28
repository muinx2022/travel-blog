import Link from "next/link";
import { notFound } from "next/navigation";
import { GenericComments } from "@/components/generic-comments";
import { PostActions } from "@/components/post-actions";
import { RichTextContent } from "@/components/rich-text-content";
import { PostDetailSidebar } from "@/components/post-detail-sidebar";
import {
  getCommentsForTarget,
  getPostByDocumentId,
  getPostGallery,
  getTagsByPost,
} from "@/lib/strapi";

export const dynamic = "force-dynamic";

type PostPageProps = {
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

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const documentId = id.includes("--") ? id.split("--").pop() : id;

  if (!documentId) {
    notFound();
  }

  const post = await getPostByDocumentId(documentId);

  if (!post) {
    notFound();
  }

  const categorySlug = post.categories?.[0]?.slug;
  const publishedDate = formatPublishedDate(post.publishedAt);

  const [comments, tags, gallery] = await Promise.all([
    getCommentsForTarget("post", post.documentId),
    getTagsByPost(post.slug),
    getPostGallery(post.documentId),
  ]);

  return (
    <div className="pb-12 pt-4">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            <Link href="/" className="transition-colors hover:text-slate-800">
              Home
            </Link>
            {categorySlug && (
              <>
                <span className="text-slate-300">/</span>
                <Link href={`/c/${categorySlug}`} className="transition-colors hover:text-slate-800">
                  {post.categories?.[0]?.name}
                </Link>
              </>
            )}
            <span className="text-slate-300">/</span>
            <span className="max-w-full truncate text-slate-700">Article</span>
          </nav>

          <div className="mb-4 flex flex-wrap gap-2">
            {(post.categories ?? []).map((category) => (
              <Link
                key={category.documentId}
                href={`/c/${category.slug}`}
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {publishedDate && <span>Published: {publishedDate}</span>}
            <span>Comments: {comments.length}</span>
          </div>

          <div className="mt-8 grid gap-8 border-t border-slate-200 pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="space-y-6">
              <RichTextContent
                html={post.content}
                className="richtext-content text-[1.05rem] leading-8 text-slate-700 dark:text-slate-200 md:text-[1.1rem]"
              />

              {gallery.length > 0 && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Thư viện ảnh
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {gallery.map((item) => (
                      <div key={item.documentId} className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                        <img
                          src={item.file.url}
                          alt={item.altText || item.caption || ""}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
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

              <div className="border-t border-slate-200 pt-5">
                <PostActions
                  targetType="post"
                  targetDocumentId={post.documentId}
                  targetTitle={post.title}
                />
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h2 className="mb-5 text-2xl font-semibold text-slate-900">Comments</h2>
                <GenericComments
                  targetType="post"
                  targetDocumentId={post.documentId}
                  initialComments={comments}
                />
              </div>
            </article>

            <aside className="border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
              <div className="lg:sticky lg:top-24">
                <PostDetailSidebar categorySlug={categorySlug} tags={tags} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/*
        Keep mobile behavior simple: sidebar is already in the same outer box,
        so no extra standalone sections below.
      */}
    </div>
  );
}
