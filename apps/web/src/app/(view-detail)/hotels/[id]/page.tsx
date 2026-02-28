import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommentsForTarget, getHotelByDocumentId } from "@/lib/strapi";
import { RichTextContent } from "@/components/rich-text-content";
import { GenericComments } from "@/components/generic-comments";
import { PostActions } from "@/components/post-actions";

export const dynamic = "force-dynamic";

type HotelPageProps = {
  params: Promise<{ id: string }>;
};

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <span className="text-amber-500">
      {"\u2605".repeat(rating)}
      {"\u2606".repeat(5 - rating)}
    </span>
  );
}

function getLowestPrice(prices: Array<number | undefined>) {
  const valid = prices.filter((p): p is number => typeof p === "number" && p > 0);
  if (valid.length === 0) return null;
  return Math.min(...valid);
}

export default async function HotelPage({ params }: HotelPageProps) {
  const { id } = await params;
  const documentId = id.includes("--") ? id.split("--").pop() : id;

  if (!documentId) {
    notFound();
  }

  const hotel = await getHotelByDocumentId(documentId);

  if (!hotel) {
    notFound();
  }

  const comments = await getCommentsForTarget("hotel" as any, hotel.documentId);
  const roomTypes = hotel.roomTypes ?? [];
  const amenities = hotel.amenities ?? [];
  const images = hotel.images ?? [];
  const lowestPrice = getLowestPrice(roomTypes.map((room) => room.price));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <article className="reveal-up rounded-[28px] border border-zinc-100 bg-white p-8 shadow-sm">
        <nav className="mb-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-sky-700">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/hotels" className="hover:text-sky-700">
            Hotels
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">{hotel.title}</span>
        </nav>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight text-slate-900 dark:text-slate-100">
          {hotel.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <StarRating rating={hotel.starRating} />
          {hotel.city && <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-slate-800">📍 {hotel.city}</span>}
          {lowestPrice != null && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
              Từ {lowestPrice.toLocaleString("vi-VN")} VND/đêm
            </span>
          )}
          <span>{comments.length} bình luận</span>
        </div>

        {(hotel.categories ?? []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(hotel.categories ?? []).map((cat) => (
              <Link
                key={cat.documentId}
                href={`/c/${cat.slug}`}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-7 grid gap-4 border-t border-zinc-200 pt-6 dark:border-slate-700 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5">
          <section className="space-y-6">
            {hotel.thumbnail?.url && (
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-slate-700">
                <img src={hotel.thumbnail.url} alt={hotel.title} className="h-72 w-full object-cover md:h-96" />
              </div>
            )}

            {hotel.excerpt && (
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">{hotel.excerpt}</p>
            )}

            {hotel.content && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <RichTextContent html={hotel.content} className="richtext-content text-slate-700 dark:text-slate-200" />
              </div>
            )}

            {images.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Thư viện ảnh</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((img) => (
                    <div key={img.id} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
                      <img src={img.url} alt={img.name} className="h-32 w-full object-cover transition-transform hover:scale-105" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {roomTypes.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Loại phòng</h2>
                {roomTypes.map((room, index) => (
                  <div key={index} className="rounded-xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{room.name}</h3>
                      <div className="flex items-center gap-2">
                        {room.price != null && (
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
                            {room.price.toLocaleString("vi-VN")} VND/đêm
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            room.available !== false
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/25 dark:text-red-300"
                          }`}
                        >
                          {room.available !== false ? "Còn phòng" : "Hết phòng"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      {room.description && <p className="text-sm text-zinc-600 dark:text-zinc-300">{room.description}</p>}
                      {room.amenities && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          <span className="font-medium">Tiện ích:</span> {room.amenities}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {hotel.videoUrl && (
              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Video</h2>
                <div className="aspect-video overflow-hidden rounded-xl border border-zinc-200 dark:border-slate-700">
                  <iframe src={hotel.videoUrl} className="h-full w-full" allowFullScreen />
                </div>
              </section>
            )}

            <section className="border-t border-zinc-200 pt-6 dark:border-slate-700">
              <PostActions
                targetType="hotel"
                targetDocumentId={hotel.documentId}
                targetTitle={hotel.title}
              />
            </section>

            <section className="border-t border-zinc-200 pt-6 dark:border-slate-700">
              <h2 className="mb-5 text-2xl font-semibold text-slate-900 dark:text-slate-100">Bình luận</h2>
              <GenericComments
                targetType={"hotel" as any}
                targetDocumentId={hotel.documentId}
                initialComments={comments}
              />
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                Thông tin nhanh
              </h3>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {hotel.city && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Thành phố:</span> {hotel.city}
                  </p>
                )}
                {hotel.address && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Địa chỉ:</span> {hotel.address}
                  </p>
                )}
                {hotel.starRating && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Xếp hạng:</span> {hotel.starRating} sao
                  </p>
                )}
                {lowestPrice != null && (
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Giá từ:</span> {lowestPrice.toLocaleString("vi-VN")} VND/đêm
                  </p>
                )}
                <p>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Bình luận:</span> {comments.length}
                </p>
              </div>
            </section>

            {amenities.length > 0 && (
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300">
                  Tiện ích
                </h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300"
                    >
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
}
