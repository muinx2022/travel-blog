import Link from "next/link";
import type { Homestay } from "@/lib/strapi";

export function CompactHomestayCard({ homestay }: { homestay: Homestay }) {
  return (
    <Link
      href={`/homestays/${homestay.slug}--${homestay.documentId}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
    >
      {homestay.thumbnail?.url ? (
        <div className="overflow-hidden">
          <img
            src={homestay.thumbnail.url}
            alt={homestay.title}
            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-purple-100 to-pink-200" />
      )}
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-blue-600">
          {homestay.title}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-zinc-500">
          {homestay.city && <span>📍 {homestay.city}</span>}
          {homestay.priceRange && (
            <span className="font-medium text-emerald-600">{homestay.priceRange}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
