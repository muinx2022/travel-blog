import Link from "next/link";
import { Post } from "@/lib/strapi";

function extractFirstImageUrl(input?: string) {
  if (!input) return null;
  const match = input.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function toPlainText(value?: string) {
  if (!value) {
    return "";
  }
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function PostCard({ post }: { post: Post }) {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const previewImage = extractFirstImageUrl(post.excerpt) ?? extractFirstImageUrl(post.content);
  const featuredImage = post.featuredImageUrl?.trim() ?? "";
  const previewImageUrl = post.preferredImageUrl || featuredImage || previewImage;
  const introText = post.introText || toPlainText(post.excerpt) || toPlainText(post.content);

  return (
    <article className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(post.categories ?? []).map((category) => (
            <Link
              key={category.documentId}
              href={`/c/${category.slug}`}
              className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              {category.name}
            </Link>
          ))}
        </div>
        {formattedDate && (
          <span className="mt-0.5 shrink-0 text-xs text-zinc-400">{formattedDate}</span>
        )}
      </div>

      <Link
        href={`/posts/${post.slug}--${post.documentId}`}
        className="block text-xl font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-blue-600"
      >
        {post.title}
      </Link>

      <div className="mt-3 flex items-start gap-3">
        <div className="h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-sky-100 to-cyan-100" />
          )}
        </div>
        <p className="line-clamp-4 text-sm leading-relaxed text-zinc-600">
          {introText || "Chua co tom tat noi dung."}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Binh luan ({post.commentsCount ?? 0})
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            Thich ({post.likesCount ?? 0})
          </span>
        </div>
        <Link
          href={`/posts/${post.slug}--${post.documentId}`}
          className="text-xs font-medium text-blue-600 hover:underline"
          aria-label={`Xem chi tiet bai viet ${post.title}`}
        >
          -&gt;
        </Link>
      </div>
    </article>
  );
}

