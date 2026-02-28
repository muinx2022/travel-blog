import { notFound } from "next/navigation";
import { RichTextContent } from "@/components/rich-text-content";
import { getPublicContentPageBySlug } from "@/lib/strapi";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublicContentPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-8">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-slate-900 md:text-4xl">
          {page.title}
        </h1>
        {page.summary && (
          <p className="mt-3 text-base leading-relaxed text-slate-600">{page.summary}</p>
        )}
        {page.content && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <RichTextContent html={page.content} className="richtext-content text-slate-700" />
          </div>
        )}
      </article>
    </div>
  );
}
