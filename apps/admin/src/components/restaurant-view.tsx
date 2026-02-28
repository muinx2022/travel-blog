"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, MapPin, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRestaurant, type RestaurantItem } from "@/lib/admin-api";

type RestaurantViewProps = {
  documentId: string;
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function RestaurantView({ documentId }: RestaurantViewProps) {
  const [restaurant, setRestaurant] = useState<RestaurantItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await getRestaurant(documentId);
        setRestaurant(item);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load restaurant details");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [documentId]);

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (error || !restaurant) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error || "Restaurant not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{restaurant.title}</CardTitle>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {restaurant.city}
                </div>
                {restaurant.cuisineType && (
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    {restaurant.cuisineType}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/restaurants">Back to list</Link>
              </Button>
              <Button asChild>
                <Link href={`/restaurants/${documentId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Slug</p>
              <p className="mt-1 text-sm">{restaurant.slug}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Price Range</p>
              <p className="mt-1 text-sm">{restaurant.priceRange || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Address</p>
              <p className="mt-1 text-sm">{restaurant.address || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <p className="mt-1 text-sm">
                {restaurant.publishedAt ? (
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
          {restaurant.excerpt && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Excerpt</p>
              <p className="mt-2 text-sm">{restaurant.excerpt}</p>
            </div>
          )}

          {/* Content */}
          {restaurant.content && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Content</p>
              <div className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-lg border bg-muted/30 p-4">
                <div dangerouslySetInnerHTML={{ __html: restaurant.content }} />
              </div>
            </div>
          )}

          {/* Categories */}
          {restaurant.categories && restaurant.categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {restaurant.categories.map((cat) => (
                  <span key={cat.documentId} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          {restaurant.author && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Author</p>
              <p className="mt-1 text-sm">{restaurant.author.username}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <div className="space-y-1">
              {restaurant.createdAt && <p>Created: {formatDate(restaurant.createdAt)}</p>}
              {restaurant.updatedAt && <p>Updated: {formatDate(restaurant.updatedAt)}</p>}
              {restaurant.publishedAt && <p>Published: {formatDate(restaurant.publishedAt)}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}