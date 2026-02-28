import Link from "next/link";
import type { Tour } from "@/lib/strapi";

export function CompactTourCard({ tour }: { tour: Tour }) {
  return (
    <Link
      href={`/tours/${tour.slug}--${tour.documentId}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
    >
      {tour.thumbnail?.url ? (
        <div className="overflow-hidden">
          <img
            src={tour.thumbnail.url}
            alt={tour.title}
            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-blue-100 to-sky-200" />
      )}
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-blue-600">
          {tour.title}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-zinc-500">
          {tour.destination && <span>📍 {tour.destination}</span>}
          {tour.duration != null && <span>🗓 {tour.duration} ngày</span>}
          {tour.price != null && (
            <span className="font-medium text-emerald-600">
              {tour.price.toLocaleString("vi-VN")} VND
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

