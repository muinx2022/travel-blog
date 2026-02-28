import Link from "next/link";
import type { Hotel } from "@/lib/strapi";

function getLowestPrice(hotel: Hotel): number | null {
  const prices = (hotel.roomTypes ?? [])
    .map((rt) => rt.price)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function CompactHotelCard({ hotel }: { hotel: Hotel }) {
  const lowestPrice = getLowestPrice(hotel);
  return (
    <Link
      href={`/hotels/${hotel.slug}--${hotel.documentId}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
    >
      {hotel.thumbnail?.url ? (
        <div className="overflow-hidden">
          <img
            src={hotel.thumbnail.url}
            alt={hotel.title}
            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-amber-100 to-orange-200" />
      )}
      <div className="p-3">
        <div className="mb-1 flex items-center gap-2 text-xs">
          {hotel.starRating && (
            <span className="text-amber-500">
              {"★".repeat(hotel.starRating)}
              {"☆".repeat(5 - hotel.starRating)}
            </span>
          )}
          {hotel.city && <span className="text-zinc-500">📍 {hotel.city}</span>}
        </div>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-blue-600">
          {hotel.title}
        </p>
        {lowestPrice && (
          <p className="mt-1 text-xs font-medium text-emerald-600">
            Từ {lowestPrice.toLocaleString("vi-VN")} VND/đêm
          </p>
        )}
      </div>
    </Link>
  );
}

