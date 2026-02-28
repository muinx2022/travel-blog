import Link from "next/link";
import type { Restaurant } from "@/lib/strapi";

export function CompactRestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/restaurants/${restaurant.slug}--${restaurant.documentId}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
    >
      {restaurant.thumbnail?.url ? (
        <div className="overflow-hidden">
          <img
            src={restaurant.thumbnail.url}
            alt={restaurant.title}
            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-orange-100 to-red-200" />
      )}
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-blue-600">
          {restaurant.title}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-zinc-500">
          {restaurant.cuisineType && <span>🍽 {restaurant.cuisineType}</span>}
          {restaurant.city && <span>📍 {restaurant.city}</span>}
          {restaurant.priceRange && (
            <span className="font-medium text-amber-600">{restaurant.priceRange}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
