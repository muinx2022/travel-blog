"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectBox } from "@/components/multi-select-box";
import { TagPicker } from "@/components/tag-picker";
import { PostAuthorPicker } from "@/components/post-author-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  createTravelGuide,
  getTravelGuide,
  listAllCategories,
  updateTravelGuide,
  type CategoryItem,
  type TravelGuideInput,
} from "@/lib/admin-api";
import { resolveRichTextMediaBeforeSave } from "@/lib/richtext-media";
import { slugify } from "@/lib/slug";
import { EntityMediaManager, generatePendingId } from "@/components/entity-media-manager";
import { bulkUpdateEntityDocumentId } from "@/lib/entity-media-api";

type TravelGuideFormProps = {
  mode: "create" | "edit";
  documentId?: string;
};

type TravelGuideField = "title" | "slug";
type RequiredTravelGuideErrors = Partial<Record<TravelGuideField | "author" | "category" | "content", string>>;

const guideTypes: Array<{ value: TravelGuideInput["guideType"]; label: string }> = [
  { value: "cam-nang", label: "Cẩm nang du lịch" },
  { value: "meo-du-lich", label: "Mẹo du lịch" },
  { value: "lich-trinh-goi-y", label: "Lịch trình gợi ý" },
];

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "<p></p>",
  guideType: "cam-nang" as TravelGuideInput["guideType"],
  categoryDocumentIds: [] as string[],
  tagDocumentIds: [] as string[],
  authorId: "",
  authorLabel: "",
  thumbnailId: null as number | null,
};

function hasContent(value: string) {
  const text = value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  if (text.length > 0) return true;
  return /<(img|iframe|video|figure|embed)\b/i.test(value);
}

export function TravelGuideForm({ mode, documentId }: TravelGuideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryOptions, setCategoryOptions] = useState<CategoryItem[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "gallery">("content");
  const [errors, setErrors] = useState<RequiredTravelGuideErrors>({});
  const [mediaPendingId] = useState(() => (mode === "create" ? generatePendingId() : null));

  const categoryTreeOptions = useMemo(() => {
    const byParent = new Map<number | null, CategoryItem[]>();
    for (const item of categoryOptions) {
      const parentId = item.parent?.id ?? null;
      const bucket = byParent.get(parentId) ?? [];
      bucket.push(item);
      byParent.set(parentId, bucket);
    }
    for (const bucket of byParent.values()) {
      bucket.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    const flattened: Array<{ value: string; label: string; depth: number }> = [];
    const visit = (parentId: number | null, level: number) => {
      for (const node of byParent.get(parentId) ?? []) {
        flattened.push({ value: node.documentId, label: node.name, depth: level });
        visit(node.id, level + 1);
      }
    };

    visit(null, 0);
    return flattened;
  }, [categoryOptions]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const categories = await listAllCategories();
        setCategoryOptions(categories);

        if (mode === "edit" && documentId) {
          const guide = await getTravelGuide(documentId);
          setForm({
            title: guide.title ?? "",
            slug: guide.slug ?? "",
            excerpt: guide.excerpt ?? "",
            content: guide.content ?? "<p></p>",
            guideType: (guide.guideType ?? "cam-nang") as TravelGuideInput["guideType"],
            categoryDocumentIds: (guide.categories ?? []).map((c) => c.documentId),
            tagDocumentIds: (guide.tags ?? []).map((t) => t.documentId),
            authorId: guide.author?.id ? String(guide.author.id) : "",
            authorLabel: guide.author
              ? `${guide.author.username}${guide.author.email ? ` (${guide.author.email})` : ""}`
              : "",
            thumbnailId: guide.thumbnail?.id ?? null,
          });
          setSlugTouched(false);
        } else {
          setForm(emptyForm);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load travel guide");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mode, documentId]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: RequiredTravelGuideErrors = {};
    if (!form.title?.trim()) nextErrors.title = "Title is required";
    if (!form.slug?.trim()) nextErrors.slug = "Slug is required";
    if (!form.content || !hasContent(form.content)) nextErrors.content = "Content is required";
    if (form.categoryDocumentIds.length === 0) nextErrors.category = "Select at least one category";
    if (!form.authorId) nextErrors.author = "Select an author";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: "Please fix the errors below", variant: "error" });
      return;
    }

    try {
      setSaving(true);
      const saveContent = await resolveRichTextMediaBeforeSave(form.content);
      const input: TravelGuideInput = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: saveContent,
        guideType: form.guideType,
        categories: form.categoryDocumentIds,
        tags: form.tagDocumentIds,
        author: Number(form.authorId) || null,
        thumbnail: form.thumbnailId,
      };

      let result;
      if (mode === "create") {
        result = await createTravelGuide(input);
      } else {
        if (!documentId) throw new Error("Missing documentId");
        result = await updateTravelGuide(documentId, input);
      }

      if (mediaPendingId && result.documentId) {
        await bulkUpdateEntityDocumentId(mediaPendingId, result.documentId);
      }

      toast({ title: mode === "create" ? "Travel guide created successfully" : "Travel guide updated successfully", variant: "success" });
      router.push("/travel-guides");
    } catch (submitError) {
      toast({ title: "Failed to save travel guide", description: submitError instanceof Error ? submitError.message : "An error occurred", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Content</span>
          <span>/</span>
          <span className="text-foreground font-medium">
            {mode === "edit" ? "Edit Travel Guide" : "New Travel Guide"}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "edit" ? "Edit Travel Guide" : "Create Travel Guide"}
        </h1>
        <p className="text-sm text-muted-foreground">Fill in guide content, tags, and media.</p>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{mode === "edit" ? "Edit Travel Guide" : "Create Travel Guide"}</CardTitle>
            <Button variant="outline" asChild>
              <Link href="/travel-guides">Back to list</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

          {!loading && !error && (
            <form onSubmit={onSubmit} className="space-y-3" noValidate>
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant={activeTab === "content" ? "default" : "outline"} onClick={() => setActiveTab("content")}>Content</Button>
                  <Button type="button" size="sm" variant={activeTab === "gallery" ? "default" : "outline"} onClick={() => setActiveTab("gallery")}>Image Gallery</Button>
                </div>

                {activeTab === "content" && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Title"
                      value={form.title}
                      className={errors.title ? "border-destructive focus-visible:ring-destructive/20" : ""}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setForm((f) => ({ ...f, title: newTitle, slug: !slugTouched ? slugify(newTitle) : f.slug }));
                        setErrors((prev) => ({
                          ...prev,
                          title: newTitle.trim() ? undefined : prev.title,
                          slug: (!slugTouched ? slugify(newTitle) : form.slug).trim() ? undefined : prev.slug,
                        }));
                      }}
                    />
                    <Input
                      placeholder="Slug"
                      value={form.slug}
                      className={errors.slug ? "border-destructive focus-visible:ring-destructive/20" : ""}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, slug: e.target.value }));
                        setSlugTouched(true);
                        if (e.target.value.trim()) {
                          setErrors((prev) => ({ ...prev, slug: undefined }));
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        value={form.authorLabel}
                        placeholder="No author selected"
                        readOnly
                        className={errors.author ? "border-destructive focus-visible:ring-destructive/20" : ""}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => setAuthorModalOpen(true)}>Select</Button>
                      {form.authorId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            setForm((f) => ({ ...f, authorId: "", authorLabel: "" }));
                            setErrors((prev) => ({ ...prev, author: "Select an author" }));
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <MultiSelectBox
                      options={categoryTreeOptions}
                      value={form.categoryDocumentIds}
                      className={errors.category ? "border-destructive focus-visible:ring-destructive/20" : ""}
                      onChange={(ids) => {
                        setForm((f) => ({ ...f, categoryDocumentIds: ids }));
                        if (ids.length > 0) setErrors((prev) => ({ ...prev, category: undefined }));
                      }}
                      placeholder="Select categories"
                    />
                    <Textarea placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} rows={3} />

                    <select
                      value={form.guideType}
                      onChange={(e) => setForm((f) => ({ ...f, guideType: e.target.value as TravelGuideInput["guideType"] }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      {guideTypes.map((gt) => (
                        <option key={gt.value} value={gt.value}>{gt.label}</option>
                      ))}
                    </select>

                    <RichTextEditor
                      value={form.content}
                      className={errors.content ? "border-destructive" : ""}
                      onChange={(content) => {
                        setForm((f) => ({ ...f, content }));
                        if (hasContent(content)) setErrors((prev) => ({ ...prev, content: undefined }));
                      }}
                      pendingId={mediaPendingId}
                    />

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Tags</p>
                      <TagPicker
                        selectedTagIds={form.tagDocumentIds}
                        onSelectedTagIdsChange={(ids) => setForm((f) => ({ ...f, tagDocumentIds: ids }))}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "gallery" && (
                  <div className="space-y-2">
                    <EntityMediaManager
                      mode="travel-guide"
                      pendingId={mediaPendingId}
                      selectedThumbnailId={form.thumbnailId}
                      onSelectThumbnail={(id) => setForm((f) => ({ ...f, thumbnailId: id }))}
                      selectedImageIds={[]}
                      onSelectImages={() => {}}
                    />
                  </div>
                )}
              </div>

              <PostAuthorPicker
                open={authorModalOpen}
                onOpenChange={setAuthorModalOpen}
                onSelect={(user) => {
                  setForm((f) => ({
                    ...f,
                    authorId: String(user.id),
                    authorLabel: `${user.username}${user.email ? ` (${user.email})` : ""}`,
                  }));
                  setErrors((prev) => ({ ...prev, author: undefined }));
                  setAuthorModalOpen(false);
                }}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : mode === "create" ? "Create Guide" : "Update Guide"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/travel-guides">Cancel</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

