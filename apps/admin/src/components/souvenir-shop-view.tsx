"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSouvenirShop, type SouvenirShopItem } from "@/lib/admin-api";

type SouvenirShopViewProps = {
  documentId: string;
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function SouvenirShopView({ documentId }: SouvenirShopViewProps) {
  const [shop, setShop] = useState<SouvenirShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await getSouvenirShop(documentId);
        setShop(item);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load shop details");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [documentId]);

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (error || !shop) {
    return <div className="space-y-4"><div className="rounded-lg bg-destructive/10 p-4"><p className="text-sm text-destructive">{error || "Shop not found"}</p></div></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{shop.title}</CardTitle>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{shop.city}</div>
                {shop.shopType && (<div className="flex items-center gap-2"><Store className="h-4 w-4" />{shop.shopType}</div>)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link href="/souvenir-shops">Back to list</Link></Button>
              <Button asChild>
                <Link href={`/souvenir-shops/${documentId}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs font-medium text-muted-foreground">Slug</p><p className="mt-1 text-sm">{shop.slug}</p></div>
            <div><p className="text-xs font-medium text-muted-foreground">Type</p><p className="mt-1 text-sm">{shop.shopType || "-"}</p></div>
            <div><p className="text-xs font-medium text-muted-foreground">Address</p><p className="mt-1 text-sm">{shop.address || "-"}</p></div>
            <div><p className="text-xs font-medium text-muted-foreground">Status</p><p className="mt-1 text-sm">{shop.publishedAt ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">● Published</span> : <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">● Draft</span>}</p></div>
          </div>
          {shop.excerpt && (<div><p className="text-xs font-medium text-muted-foreground">Excerpt</p><p className="mt-2 text-sm">{shop.excerpt}</p></div>)}
          {shop.content && (<div><p className="text-xs font-medium text-muted-foreground">Content</p><div className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-lg border bg-muted/30 p-4"><div dangerouslySetInnerHTML={{ __html: shop.content }} /></div></div>)}
          {shop.categories && shop.categories.length > 0 && (<div><p className="text-xs font-medium text-muted-foreground">Categories</p><div className="mt-2 flex flex-wrap gap-2">{shop.categories.map((cat) => (<span key={cat.documentId} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{cat.name}</span>))}</div></div>)}
          {shop.author && (<div><p className="text-xs font-medium text-muted-foreground">Author</p><p className="mt-1 text-sm">{shop.author.username}</p></div>)}
          <div className="border-t pt-4 text-xs text-muted-foreground"><div className="space-y-1">{shop.createdAt && <p>Created: {formatDate(shop.createdAt)}</p>}{shop.updatedAt && <p>Updated: {formatDate(shop.updatedAt)}</p>}{shop.publishedAt && <p>Published: {formatDate(shop.publishedAt)}</p>}</div></div>
        </CardContent>
      </Card>
    </div>
  );
}