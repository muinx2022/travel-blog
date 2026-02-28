"use client";

import Link from "next/link";
import { MyServiceFieldMeta, MyServiceStatusBadge } from "./common";

type MyHotelRow = {
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  city?: string;
  starRating?: number;
  status?: "draft" | "published";
  publishedAt?: string | null;
};

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return <span className="text-amber-500">{"★".repeat(rating)}</span>;
}

export function HotelRowContent({ hotel }: { hotel: MyHotelRow }) {
  const published = hotel.status === "published" || Boolean(hotel.publishedAt);

  return (
    <>
      <div className="mb-1 flex items-center gap-2">
        <StarRating rating={hotel.starRating} />
        {hotel.city && <MyServiceFieldMeta>📍 {hotel.city}</MyServiceFieldMeta>}
        <MyServiceStatusBadge published={published} />
      </div>
      <Link
        href={`/hotels/${hotel.slug}--${hotel.documentId}`}
        className="block text-base font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
      >
        {hotel.title}
      </Link>
      {hotel.excerpt && (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {hotel.excerpt}
        </p>
      )}
    </>
  );
}
