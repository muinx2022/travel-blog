import Link from "next/link";
import type { TravelGuide } from "@/lib/strapi";

export function CompactGuideCard({ guide }: { guide: TravelGuide }) {
  const guideTypeLabel: Record<string, string> = {
    "cam-nang": "Cẩm nang",
    "meo-du-lich": "Mẹo du lịch",
    "lich-trinh-goi-y": "Lịch trình",
  };

  return (
    <Link
      href={`/guides/${guide.slug}--${guide.documentId}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
    >
      {guide.thumbnail?.url ? (
        <div className="overflow-hidden">
          <img
            src={guide.thumbnail.url}
            alt={guide.title}
            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-teal-100 to-cyan-200" />
      )}
      <div className="p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-600">
          {guideTypeLabel[guide.guideType ?? "cam-nang"] ?? "Hướng dẫn"}
        </p>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-blue-600">
          {guide.title}
        </p>
      </div>
    </Link>
  );
}
