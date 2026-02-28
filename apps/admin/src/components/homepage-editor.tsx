"use client";

import { useEffect, useState } from "react";
import { Home, Loader2, XCircle } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor";
import { resolveRichTextMediaBeforeSave } from "@/lib/richtext-media";
import { getHomepage, updateHomepage, type HomepageItem } from "@/lib/admin-api";

export function HomepageEditor() {
  const canUpdate = true;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<HomepageItem>({
    heroTitle: "",
    heroSubtitle: "",
    heroPrimaryCtaLabel: "",
    heroPrimaryCtaLink: "",
    heroSecondaryCtaLabel: "",
    heroSecondaryCtaLink: "",
    featuredLabel: "",
    postsSectionTitle: "",
    destinationsSectionTitle: "",
    featuredPostsCount: 3,
    feedPostsCount: 5,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getHomepage();
        setForm((prev) => ({ ...prev, ...(data ?? {}) }));
      } catch (error) {
        toast({ title: error instanceof Error ? error.message : "Failed to load homepage", variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      const heroSubtitle = await resolveRichTextMediaBeforeSave(form.heroSubtitle ?? "");
      await updateHomepage({
        ...form,
        heroSubtitle,
        featuredPostsCount: Number(form.featuredPostsCount ?? 3),
        feedPostsCount: Number(form.feedPostsCount ?? 5),
      });
      toast({ title: "Homepage settings saved", variant: "success" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save homepage", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Content</span>
            <span>/</span>
            <span className="text-foreground font-medium">Homepage</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            Homepage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Edit hero box and post section labels on web homepage</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading homepage settings...</span>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input
                value={form.heroTitle ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, heroTitle: e.target.value }))}
                placeholder="Hero title"
                className="h-10"
              />
              <RichTextEditor
                value={form.heroSubtitle ?? "<p></p>"}
                onChange={(heroSubtitle) => setForm((prev) => ({ ...prev, heroSubtitle }))}
                placeholder="Hero subtitle"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.heroPrimaryCtaLabel ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, heroPrimaryCtaLabel: e.target.value }))}
                  placeholder="Primary CTA label"
                  className="h-10"
                />
                <Input
                  value={form.heroPrimaryCtaLink ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, heroPrimaryCtaLink: e.target.value }))}
                  placeholder="Primary CTA link"
                  className="h-10"
                />
                <Input
                  value={form.heroSecondaryCtaLabel ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, heroSecondaryCtaLabel: e.target.value }))}
                  placeholder="Secondary CTA label"
                  className="h-10"
                />
                <Input
                  value={form.heroSecondaryCtaLink ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, heroSecondaryCtaLink: e.target.value }))}
                  placeholder="Secondary CTA link"
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.destinationsSectionTitle ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, destinationsSectionTitle: e.target.value }))}
                  placeholder="Destinations section title"
                  className="h-10"
                />
                <Input
                  value={form.postsSectionTitle ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, postsSectionTitle: e.target.value }))}
                  placeholder="Posts section title"
                  className="h-10"
                />
              </div>
              <Input
                value={form.featuredLabel ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, featuredLabel: e.target.value }))}
                placeholder="Featured label"
                className="h-10"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  min={1}
                  value={form.featuredPostsCount ?? 3}
                  onChange={(e) => setForm((prev) => ({ ...prev, featuredPostsCount: Number(e.target.value) }))}
                  placeholder="Featured posts count"
                  className="h-10"
                />
                <Input
                  type="number"
                  min={1}
                  value={form.feedPostsCount ?? 5}
                  onChange={(e) => setForm((prev) => ({ ...prev, feedPostsCount: Number(e.target.value) }))}
                  placeholder="Feed posts count"
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={onSave} 
              disabled={!canUpdate || saving}
              className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {saving ? "Saving..." : "Save homepage"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
