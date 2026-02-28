"use client";

import Link from "next/link";
import { MyServiceFieldMeta, MyServiceStatusBadge } from "./common";

type MyTourRow = {
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  destination?: string;
  duration?: number;
  price?: number;
  status?: "draft" | "published";
  publishedAt?: string | null;
};

function formatPrice(price?: number) {
  if (!price) return null;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function TourRowContent({ tour }: { tour: MyTourRow }) {
  const published = tour.status === "published" || Boolean(tour.publishedAt);

  return (
    <>
      <div className="mb-1 flex items-center gap-2">
        {tour.destination && <MyServiceFieldMeta>📍 {tour.destination}</MyServiceFieldMeta>}
        {tour.duration && <MyServiceFieldMeta>⏱ {tour.duration} ngày</MyServiceFieldMeta>}
        {tour.price && <span className="text-xs text-emerald-600">{formatPrice(tour.price)}</span>}
        <MyServiceStatusBadge published={published} />
      </div>
      <Link
        href={`/tours/${tour.slug}--${tour.documentId}`}
        className="block text-base font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
      >
        {tour.title}
      </Link>
      {tour.excerpt && (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {tour.excerpt}
        </p>
      )}
    </>
  );
}
