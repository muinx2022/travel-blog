"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  createContentPage,
  getContentPage,
  updateContentPage,
  type ContentPageInput,
} from "@/lib/admin-api";
import { resolveRichTextMediaBeforeSave } from "@/lib/richtext-media";
import { slugify } from "@/lib/slug";

type ContentPageFormProps = {
  mode: "create" | "edit";
  documentId?: string;
};

export function ContentPageForm({ mode, documentId }: ContentPageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [form, setForm] = useState<ContentPageInput>({
    title: "",
    slug: "",
    summary: "",
    content: "<p></p>",
    navigationLabel: "",
    showInHeader: false,
    showInFooter: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (mode !== "edit" || !documentId) {
      return;
    }

    const load = async () => {
      try {
        const data = await getContentPage(documentId);
        setForm({
          title: data.title ?? "",
          slug: data.slug ?? "",
          summary: data.summary ?? "",
          content: data.content ?? "<p></p>",
          navigationLabel: data.navigationLabel ?? "",
          showInHeader: Boolean(data.showInHeader),
          showInFooter: data.showInFooter !== false,
          sortOrder: Number(data.sortOrder ?? 0),
        });
        setSlugTouched(true);
      } catch (error) {
        toast({ title: error instanceof Error ? error.message : "Failed to load content page", variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [mode, documentId]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title?.trim()) {
      toast({ title: "Title is required", variant: "error" });
      return;
    }

    try {
      setSaving(true);
      const content = await resolveRichTextMediaBeforeSave(form.content ?? "");
      const payload: ContentPageInput = {
        ...form,
        content,
        sortOrder: Number(form.sortOrder ?? 0),
      };

      if (mode === "create") {
        await createContentPage(payload);
        toast({ title: "Content page created", variant: "success" });
      } else if (documentId) {
        await updateContentPage(documentId, payload);
        toast({ title: "Content page updated", variant: "success" });
      }

      router.push("/content-pages");
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save content page", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Content</span>
          <span>/</span>
          <span className="text-foreground font-medium">
            {mode === "create" ? "New Page" : "Edit Page"}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "create" ? "New Content Page" : "Edit Content Page"}
        </h1>
        <p className="text-sm text-muted-foreground">Create or update static pages used across the website.</p>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-base">Page Content</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input
              value={form.title ?? ""}
              onChange={(e) => {
                const nextTitle = e.target.value;
                const nextSlug = slugTouched ? (form.slug ?? "") : slugify(nextTitle);
                setForm((prev) => ({ ...prev, title: nextTitle, slug: nextSlug }));
              }}
              placeholder="Title"
              required
            />
            <Input
              value={form.slug ?? ""}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
              placeholder="Slug"
            />
            <Input
              value={form.navigationLabel ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, navigationLabel: e.target.value }))}
              placeholder="Navigation label"
            />
            <Textarea
              value={form.summary ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="Summary"
              rows={3}
            />
            <RichTextEditor
              value={form.content ?? "<p></p>"}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
              placeholder="Page content..."
            />
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="number"
                value={Number(form.sortOrder ?? 0)}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                placeholder="Sort order"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(form.showInHeader)}
                  onChange={(e) => setForm((prev) => ({ ...prev, showInHeader: e.target.checked }))}
                />
                Show in header
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.showInFooter !== false}
                  onChange={(e) => setForm((prev) => ({ ...prev, showInFooter: e.target.checked }))}
                />
                Show in footer
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/content-pages")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
