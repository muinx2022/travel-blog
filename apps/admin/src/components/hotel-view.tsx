"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Pencil, Tag, Star, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getHotel, type HotelItem } from "@/lib/admin-api";

type HotelViewProps = {
  documentId: string;
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </span>
  );
}

export function HotelView({ documentId }: HotelViewProps) {
  const [hotel, setHotel] = useState<HotelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await getHotel(documentId);
        setHotel(item);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load hotel details");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [documentId]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Hotel View</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/hotels">Back to list</Link>
              </Button>
              <Button asChild>
                <Link href={`/hotels/${documentId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && hotel && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-semibold">{hotel.title}</h1>
                <p className="text-sm text-muted-foreground">{hotel.slug}</p>
                <p className="text-xs text-muted-foreground">
                  Author: {hotel.author?.username ?? "none"} · Updated: {formatDate(hotel.updatedAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <StarRating rating={hotel.starRating} />
                {hotel.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {hotel.city}
                  </span>
                )}
                {hotel.address && (
                  <span className="text-muted-foreground">{hotel.address}</span>
                )}
              </div>

              {hotel.excerpt && <p className="text-sm text-muted-foreground">{hotel.excerpt}</p>}

              {(hotel.categories ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(hotel.categories ?? []).map((cat) => (
                    <span
                      key={cat.documentId}
                      className="inline-flex items-center rounded-full border px-2 py-1 text-xs"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              {(hotel.amenities ?? []).length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Tiện ích khách sạn</h2>
                  <div className="flex flex-wrap gap-2">
                    {(hotel.amenities ?? []).map((amenity, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {amenity.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hotel.content && (
                <div className="rounded-md border bg-background p-4">
                  <div
                    className="richtext-content"
                    dangerouslySetInnerHTML={{ __html: hotel.content }}
                  />
                </div>
              )}

              {(hotel.roomTypes ?? []).length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Loại phòng</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên phòng</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead className="text-right">Giá/đêm</TableHead>
                        <TableHead className="text-center">Còn phòng</TableHead>
                        <TableHead>Tiện ích</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(hotel.roomTypes ?? []).map((room, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{room.name}</TableCell>
                          <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                            {room.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {room.price != null
                              ? `${room.price.toLocaleString("vi-VN")} VND`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {room.available !== false ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                            {room.amenities || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {hotel.videoUrl && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Video</h2>
                  <div className="aspect-video max-w-2xl">
                    <iframe
                      src={hotel.videoUrl}
                      className="h-full w-full rounded-md"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
