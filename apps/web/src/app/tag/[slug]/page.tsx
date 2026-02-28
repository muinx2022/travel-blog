import Link from "next/link";
import { notFound } from "next/navigation";
import { InfinitePosts } from "@/components/infinite-posts";
import { getPostsWithPaginationByTag, getTagBySlug } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const postsData = await getPostsWithPaginationByTag(1, 10, slug);
  const posts = postsData?.data ?? [];
  const total = postsData?.meta?.pagination?.total ?? 0;

  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10">
        <div className="rounded-[28px] border border-zinc-100 bg-white p-8 shadow-sm">
          <nav className="mb-4 text-sm text-zinc-400">
            <Link href="/" className="hover:text-sky-700">
              Trang chủ
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-zinc-700">#{tag.name}</span>
          </nav>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight text-slate-900">
            Bài viết theo tag #{tag.name}
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <InfinitePosts initialPosts={posts} initialTotal={total} tagSlug={slug} />
      </section>
    </div>
  );
}
