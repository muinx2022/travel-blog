import Link from "next/link";
import type { ReactNode } from "react";
import {
  getHotelsWithPagination,
  getHomestaysWithPagination,
  getRestaurantsWithPagination,
  getSouvenirShopsWithPagination,
  getTravelGuidesByTags,
  getToursByTags,
  type Tag,
} from "@/lib/strapi";

interface PostDetailSidebarProps {
  categorySlug?: string;
  tags?: Tag[];
}

function SidebarSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="pt-5 first:pt-0">
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h3>
        <Link href={href} className="text-xs font-semibold text-sky-700 transition-colors hover:text-sky-900">
          Xem tất cả
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SidebarItem({
  href,
  title,
  imageUrl,
  meta,
  badge,
}: {
  href: string;
  title: string;
  imageUrl?: string | null;
  meta?: string | null;
  badge?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg p-2 transition-all hover:bg-slate-50"
    >
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sky-100 to-cyan-100" />
        )}
      </div>
      <div className="min-w-0">
        {badge && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">{badge}</p>
        )}
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-sky-800">
          {title}
        </p>
        {meta && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{meta}</p>}
      </div>
    </Link>
  );
}

export async function PostDetailSidebar({
  categorySlug,
  tags,
}: PostDetailSidebarProps) {
  const tagSlugs = tags?.map((tag) => tag.slug) ?? [];

  const results = await Promise.allSettled([
    getToursByTags(tagSlugs, 3),
    getHotelsWithPagination(1, 3, categorySlug),
    getHomestaysWithPagination(1, 3, categorySlug),
    getRestaurantsWithPagination(1, 3, categorySlug),
    getSouvenirShopsWithPagination(1, 3, categorySlug),
    getTravelGuidesByTags(tagSlugs, 3),
  ]);

  const tours = results[0]?.status === "fulfilled" ? (results[0].value ?? []) : [];
  const hotels = results[1]?.status === "fulfilled" ? (results[1].value?.data ?? []) : [];
  const homestays = results[2]?.status === "fulfilled" ? (results[2].value?.data ?? []) : [];
  const restaurants = results[3]?.status === "fulfilled" ? (results[3].value?.data ?? []) : [];
  const shops = results[4]?.status === "fulfilled" ? (results[4].value?.data ?? []) : [];
  const guides = results[5]?.status === "fulfilled" ? (results[5].value ?? []) : [];

  return (
    <div className="space-y-2">
      {guides.length > 0 && (
        <SidebarSection title="Travel Guides" href="/guides">
          {guides.slice(0, 2).map((guide) => (
            <SidebarItem
              key={guide.documentId}
              href={`/guides/${guide.slug}--${guide.documentId}`}
              title={guide.title}
              imageUrl={guide.thumbnail?.url}
              badge={guide.guideType ?? "Guide"}
            />
          ))}
        </SidebarSection>
      )}

      {tours.length > 0 && (
        <SidebarSection title="Related Tours" href="/tours">
          {tours.slice(0, 2).map((tour) => (
            <SidebarItem
              key={tour.documentId}
              href={`/tours/${tour.slug}--${tour.documentId}`}
              title={tour.title}
              imageUrl={tour.thumbnail?.url}
              meta={[
                tour.destination,
                typeof tour.duration === "number" ? `${tour.duration} ngày` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SidebarSection>
      )}

      {hotels.length > 0 && (
        <SidebarSection title="Recommended Hotels" href="/hotels">
          {hotels.slice(0, 2).map((hotel) => (
            <SidebarItem
              key={hotel.documentId}
              href={`/hotels/${hotel.slug}--${hotel.documentId}`}
              title={hotel.title}
              imageUrl={hotel.thumbnail?.url}
              meta={[hotel.city, hotel.starRating ? `${hotel.starRating} sao` : null]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SidebarSection>
      )}

      {homestays.length > 0 && (
        <SidebarSection title="Homestays" href="/homestays">
          {homestays.slice(0, 2).map((homestay) => (
            <SidebarItem
              key={homestay.documentId}
              href={`/homestays/${homestay.slug}--${homestay.documentId}`}
              title={homestay.title}
              imageUrl={homestay.thumbnail?.url}
              meta={[homestay.city, homestay.priceRange].filter(Boolean).join(" · ")}
            />
          ))}
        </SidebarSection>
      )}

      {restaurants.length > 0 && (
        <SidebarSection title="Restaurants" href="/restaurants">
          {restaurants.slice(0, 2).map((restaurant) => (
            <SidebarItem
              key={restaurant.documentId}
              href={`/restaurants/${restaurant.slug}--${restaurant.documentId}`}
              title={restaurant.title}
              imageUrl={restaurant.thumbnail?.url}
              meta={[restaurant.cuisineType, restaurant.city, restaurant.priceRange]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </SidebarSection>
      )}

      {shops.length > 0 && (
        <SidebarSection title="Souvenir Shops" href="/shops">
          {shops.slice(0, 2).map((shop) => (
            <SidebarItem
              key={shop.documentId}
              href={`/shops/${shop.slug}--${shop.documentId}`}
              title={shop.title}
              imageUrl={shop.thumbnail?.url}
              meta={[shop.shopType, shop.city].filter(Boolean).join(" · ")}
            />
          ))}
        </SidebarSection>
      )}
    </div>
  );
}

