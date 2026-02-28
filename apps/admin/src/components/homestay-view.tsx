"use client";

import { MapPin } from "lucide-react";
import { getHomestay } from "@/lib/admin-api";
import { useResource } from "@/lib/hooks/use-resource";
import { ResourceViewPage } from "@/components/resource-view-page";
import { formatDate } from "@/lib/utils";

type HomestayViewProps = {
  documentId: string;
};

export function HomestayView({ documentId }: HomestayViewProps) {
  const { item: homestay, loading, error } = useResource(getHomestay, documentId);

  return (
    <ResourceViewPage
      resourceName="Homestay"
      documentId={documentId}
      loading={loading}
      error={error}
    >
      {homestay && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{homestay.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {homestay.city}
              </div>
            </div>
          </div>
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Slug</p>
              <p className="mt-1 text-sm">{homestay.slug}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Price Range
              </p>
              <p className="mt-1 text-sm">{homestay.priceRange || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Address
              </p>
              <p className="mt-1 text-sm">{homestay.address || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Status
              </p>
              <p className="mt-1 text-sm">
                {homestay.publishedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    ● Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    ● Draft
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Excerpt */}
          {homestay.excerpt && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Excerpt
              </p>
              <p className="mt-2 text-sm">{homestay.excerpt}</p>
            </div>
          )}

          {/* Content */}
          {homestay.content && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Content
              </p>
              <div className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-lg border bg-muted/30 p-4">
                <div dangerouslySetInnerHTML={{ __html: homestay.content }} />
              </div>
            </div>
          )}

          {/* Categories */}
          {homestay.categories && homestay.categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Categories
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {homestay.categories.map((cat) => (
                  <span
                    key={cat.documentId}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          {homestay.author && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Author
              </p>
              <p className="mt-1 text-sm">{homestay.author.username}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <div className="space-y-1">
              {homestay.createdAt && (
                <p>Created: {formatDate(homestay.createdAt)}</p>
              )}
              {homestay.updatedAt && (
                <p>Updated: {formatDate(homestay.updatedAt)}</p>
              )}
              {homestay.publishedAt && (
                <p>Published: {formatDate(homestay.publishedAt)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </ResourceViewPage>
  );
}
