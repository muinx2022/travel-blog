import Link from "next/link";
import { InfinitePosts } from "@/components/infinite-posts";
import { RichTextContent } from "@/components/rich-text-content";
import {
  getHomepageConfig,
  getPostsWithPagination,
  getTopLevelCategories,
} from "@/lib/strapi";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categoriesPromise = getTopLevelCategories();
  const homepageConfig = await getHomepageConfig();
  const primaryCtaLabel = homepageConfig?.heroPrimaryCtaLabel?.trim() ?? "";
  const primaryCtaLink = homepageConfig?.heroPrimaryCtaLink?.trim() ?? "";
  const secondaryCtaLabel = homepageConfig?.heroSecondaryCtaLabel?.trim() ?? "";
  const secondaryCtaLink = homepageConfig?.heroSecondaryCtaLink?.trim() ?? "";
  const hasPrimaryCta = Boolean(primaryCtaLabel && primaryCtaLink);
  const hasSecondaryCta = Boolean(secondaryCtaLabel && secondaryCtaLink);
  const hasAnyCta = hasPrimaryCta || hasSecondaryCta;
  const featuredCount = Math.max(1, Number(homepageConfig?.featuredPostsCount ?? 3));
  const feedCount = Math.max(1, Number(homepageConfig?.feedPostsCount ?? 5));
  const homePageSize = featuredCount + feedCount;

  const [postsData, categories] = await Promise.all([
    getPostsWithPagination(1, homePageSize),
    categoriesPromise,
  ]);

  const normalizedPosts = postsData?.data || [];
  const total = postsData?.meta?.pagination?.total || 0;
  const featuredPosts = normalizedPosts.slice(0, featuredCount);
  const feedPosts = normalizedPosts.slice(featuredCount, featuredCount + feedCount);
  const feedTotal = Math.max(0, total - featuredPosts.length);
  const displayedCategories = (categories ?? []).slice(0, 8);
  const featuredImageUrl = featuredPosts[0]?.preferredImageUrl;

  return (
    <div>
      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-8">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-8 top-1/2 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl animate-pulse-glow delay-500" />
        
        <div className="reveal-up relative overflow-hidden rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl shadow-sky-100/50 backdrop-blur-xl md:p-10 mesh-gradient">
          <div className="relative z-10">
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-[1.2] tracking-tight text-slate-900 md:text-4xl">
              {homepageConfig?.heroTitle ?? "Khám phá địa danh qua bài viết chi tiết và dễ áp dụng."}
            </h1>
            <RichTextContent
              className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg"
              html={
                homepageConfig?.heroSubtitle ??
                "<p>Blog chia sẻ địa danh, kinh nghiệm và cẩm nang du lịch Việt Nam.</p>"
              }
            />
            {hasAnyCta && (
              <div className="mt-8 flex flex-wrap gap-4">
                {hasPrimaryCta && (
                  <a
                    href={primaryCtaLink}
                    className="group relative overflow-hidden rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition-all hover:shadow-xl hover:shadow-sky-300 hover:-translate-y-0.5 btn-shine"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {primaryCtaLabel}
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </a>
                )}
                {hasSecondaryCta && (
                  <a
                    href={secondaryCtaLink}
                    className="group rounded-full border-2 border-slate-200 bg-white/80 px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                  >
                    {secondaryCtaLabel}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="top-destinations" className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 md:text-3xl">
              {homepageConfig?.destinationsSectionTitle ?? "Khám phá điểm đến"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Những địa điểm tuyệt vời đang chờ đón bạn</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {displayedCategories.map((category, index) => (
            <Link
              key={category.documentId}
              href={`/c/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100/50 hover:border-sky-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-cyan-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative z-10 flex min-h-[80px] flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-600 transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all duration-300 group-hover:bg-sky-100 group-hover:text-sky-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
                
                <div className="mt-3">
                  <p className="font-[family-name:var(--font-playfair)] text-base font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                    {category.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 transition-colors group-hover:text-sky-500">Khám phá ngay</p>
                </div>
              </div>
            </Link>
          ))}
          {displayedCategories.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center">
              <p className="text-sm text-slate-400">Chưa có địa danh nào.</p>
            </div>
          )}
        </div>
      </section>

      {/* Posts */}
      <section id="insights" className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 md:text-3xl">
              {homepageConfig?.postsSectionTitle ?? "Bài viết mới nhất"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Cập nhật những trải nghiệm và kinh nghiệm du lịch mới nhất</p>
          </div>
          <div className="badge badge-secondary">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {total} bài viết
          </div>
        </div>

        {featuredPosts.length > 0 && (
          <div className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            {/* Main Featured Post */}
            <Link
              href={`/posts/${featuredPosts[0].slug}--${featuredPosts[0].documentId}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100/50"
            >
              {featuredImageUrl && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={featuredImageUrl}
                    alt={featuredPosts[0].title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                </div>
              )}

              <div className={`p-6 ${featuredImageUrl ? 'absolute bottom-0 left-0 right-0' : ''}`}>
                <span className="badge badge-primary mb-3">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {homepageConfig?.featuredLabel ?? "Mới nhất"}
                </span>
                <h3 className={`font-[family-name:var(--font-playfair)] text-2xl font-bold leading-snug ${featuredImageUrl ? 'text-white' : 'text-slate-900 group-hover:text-sky-700'}`}>
                  {featuredPosts[0].title}
                </h3>
                {(featuredPosts[0].excerpt || featuredPosts[0].content) && (
                  <p className={`mt-3 line-clamp-2 text-sm leading-relaxed ${featuredImageUrl ? 'text-slate-200' : 'text-slate-600'}`}>
                    {featuredPosts[0].excerpt ?? featuredPosts[0].content?.replace(/<[^>]*>/g, "").trim()}
                  </p>
                )}
              </div>
            </Link>

            {/* Side Featured Posts */}
            <div className="flex flex-col gap-4">
              {featuredPosts.slice(1).map((post, index) => {
                const smallPreviewImage = post.preferredImageUrl;

                return (
                  <Link
                    key={post.documentId}
                    href={`/posts/${post.slug}--${post.documentId}`}
                    className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-sky-100"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {smallPreviewImage ? (
                        <img
                          src={smallPreviewImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100">
                          <svg className="h-8 w-8 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="line-clamp-2 font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-sky-700">
                        {post.title}
                      </h4>
                      {post.introText && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {post.introText}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1 text-xs text-sky-600 font-medium opacity-0 transition-opacity group-hover:opacity-100">
                        Đọc tiếp
                        <svg className="h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {featuredPosts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-3 text-sm text-slate-400">Chưa có bài viết nào.</p>
          </div>
        )}

        {feedTotal > 0 && (
          <InfinitePosts
            initialPosts={feedPosts}
            initialTotal={feedTotal}
            totalOffset={featuredCount}
            pageSize={homePageSize}
          />
        )}
      </section>
    </div>
  );
}
