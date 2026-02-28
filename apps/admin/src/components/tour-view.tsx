"use client";

import { MapPin, Tag } from "lucide-react";
import { getTour } from "@/lib/admin-api";
import { useResource } from "@/lib/hooks/use-resource";
import { ResourceViewPage } from "@/components/resource-view-page";
import { formatDate } from "@/lib/utils";

type TourViewProps = {
  documentId: string;
};

export function TourView({ documentId }: TourViewProps) {
  const { item: tour, loading, error } = useResource(getTour, documentId);

  return (
    <ResourceViewPage
      resourceName="Tour"
      documentId={documentId}
      loading={loading}
      error={error}
    >
      {tour && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{tour.title}</h1>
            <p className="text-sm text-muted-foreground">{tour.slug}</p>
            <p className="text-xs text-muted-foreground">
              Author: {tour.author?.username ?? "none"} · Updated:{" "}
              {formatDate(tour.updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {tour.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {tour.destination}
              </span>
            )}
            {tour.duration != null && (
              <span className="text-muted-foreground">
                {tour.duration} ngày
              </span>
            )}
            {tour.price != null && (
              <span className="text-muted-foreground">
                {tour.price.toLocaleString("vi-VN")} VND
              </span>
            )}
          </div>

          {tour.excerpt && (
            <p className="text-sm text-muted-foreground">{tour.excerpt}</p>
          )}

          {(tour.categories ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(tour.categories ?? []).map((cat) => (
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

          {tour.content && (
            <div className="rounded-md border bg-background p-4">
              <div
                className="richtext-content"
                dangerouslySetInnerHTML={{ __html: tour.content }}
              />
            </div>
          )}

          {(tour.itinerary ?? []).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Lịch trình</h2>
              {(tour.itinerary ?? []).map((day, index) => (
                <div key={index} className="rounded-md border p-4 space-y-2">
                  <h3 className="font-medium">
                    {day.label}: {day.title}
                  </h3>
                  {day.description && (
                    <div
                      className="richtext-content text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: day.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ResourceViewPage>
  );
}
