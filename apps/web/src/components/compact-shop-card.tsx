import Link from "next/link";
import type { SouvenirShop } from "@/lib/strapi";

export function CompactShopCard({ shop }: { shop: SouvenirShop }) {
  return (
    <Link
      href={`/shops/${shop.slug}--${shop.documentId}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
    >
      {shop.thumbnail?.url ? (
        <div className="overflow-hidden">
          <img
            src={shop.thumbnail.url}
            alt={shop.title}
            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-yellow-100 to-yellow-200" />
      )}
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-blue-600">
          {shop.title}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-zinc-500">
          {shop.shopType && <span>🛍 {shop.shopType}</span>}
          {shop.city && <span>📍 {shop.city}</span>}
        </div>
      </div>
    </Link>
  );
}
