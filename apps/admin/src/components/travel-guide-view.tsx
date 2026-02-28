"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTravelGuide, type TravelGuideItem } from "@/lib/admin-api";

type TravelGuideViewProps = {
  documentId: string;
};

const guideTypeLabels: Record<TravelGuideItem["guideType"], string> = {
  "cam-nang": "Cẩm nang du lịch",
  "meo-du-lich": "Mẹo du lịch",
  "lich-trinh-goi-y": "Lịch trình",
};

export function TravelGuideView({ documentId }: TravelGuideViewProps) {
  const [guide, setGuide] = useState<TravelGuideItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTravelGuide(documentId);
        setGuide(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load travel guide");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [documentId]);

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (error || !guide) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error || "Travel guide not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/travel-guides/${documentId}/edit"}>
              <Button size="sm" variant="outline">
                <ArrowLeft className="h-4 w-4" /> Edit
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{guide.title}</h1>
          <p className="text-sm text-muted-foreground">Guide {guide.publishedAt ? "Published" : "Draft"}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>Created: {new Date(guide.createdAt).toLocaleDateString()}</div>
          {guide.publishedAt && <div>Published: {new Date(guide.publishedAt).toLocaleDateString()}</div>}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-mono text-sm">{guide.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="text-sm">{guideTypeLabels[guide.guideType]}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Excerpt</p>
            <p className="text-sm">{guide.excerpt || "–"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Author</p>
            <p className="text-sm">{guide.author?.username || "–"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Categories</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {(guide.categories || []).map((cat) => (
                <span key={cat.documentId} className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {guide.content && (
        <Card>
          <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: guide.content }} />
          </CardContent>
        </Card>
      )}

      {guide.thumbnail && (
        <Card>
          <CardHeader><CardTitle className="text-base">Thumbnail</CardTitle></CardHeader>
          <CardContent>
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted">
              <img
                src={guide.thumbnail.url}
                alt={guide.title}
                className="h-full w-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
