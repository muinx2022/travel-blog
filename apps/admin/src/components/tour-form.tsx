"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, UserX } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectBox } from "@/components/multi-select-box";
import { PostAuthorPicker } from "@/components/post-author-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  createTour,
  getTour,
  listAllCategories,
  updateTour,
  type CategoryItem,
  type ItineraryDay,
  type UserItem,
} from "@/lib/admin-api";
import { resolveRichTextMediaBeforeSave } from "@/lib/richtext-media";
import { slugify } from "@/lib/slug";
import { EntityMediaManager, generatePendingId } from "@/components/entity-media-manager";
import { bulkUpdateEntityDocumentId } from "@/lib/entity-media-api";
import { TagPicker } from "@/components/tag-picker";

type TourFormProps = {
  mode: "create" | "edit";
  documentId?: string;
};

type TourField = "title" | "slug";
type RequiredTourErrors = Partial<Record<TourField | "author" | "category" | "content", string>>;
type TourTab = "content" | "gallery" | "itinerary";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "<p></p>",
  destination: "",
  duration: "",
  price: "",
  categoryDocumentIds: [] as string[],
  tagDocumentIds: [] as string[],
  authorId: "",
  authorLabel: "",
};

function hasContent(value: string) {
  const text = value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  if (text.length > 0) return true;
  return /<(img|iframe|video|figure|embed)\b/i.test(value);
}

export function TourForm({ mode, documentId }: TourFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryOptions, setCategoryOptions] = useState<CategoryItem[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [errors, setErrors] = useState<RequiredTourErrors>({});
  const [itinerary, setItinerary] = useState<Omit<ItineraryDay, "id">[]>([]);
  const [mediaPendingId] = useState(() => (mode === "create" ? generatePendingId() : null));
  const [activeTab, setActiveTab] = useState<TourTab>("content");

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
          const tour = await getTour(documentId);
          setForm({
            title: tour.title ?? "",
            slug: tour.slug ?? "",
            excerpt: tour.excerpt ?? "",
            content: tour.content ?? "<p></p>",
            destination: tour.destination ?? "",
            duration: tour.duration != null ? String(tour.duration) : "",
            price: tour.price != null ? String(tour.price) : "",
            categoryDocumentIds: (tour.categories ?? []).map((c) => c.documentId),
            tagDocumentIds: (tour.tags ?? []).map((c) => c.documentId),
            authorId: tour.author?.id ? String(tour.author.id) : "",
            authorLabel: tour.author
              ? `${tour.author.username}${tour.author.email ? ` (${tour.author.email})` : ""}`
              : "",
          });
          setItinerary(
            (tour.itinerary ?? []).map((day) => ({
              label: day.label,
              title: day.title,
              description: day.description ?? "",
            })),
          );
          setSlugTouched(false);
        } else {
          setForm(emptyForm);
          setItinerary([]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load tour");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [mode, documentId]);

  const validateForm = () => {
    const nextErrors: RequiredTourErrors = {};
    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.slug.trim()) nextErrors.slug = "Slug is required";
    if (!form.authorId) nextErrors.author = "Author is required";
    if (form.categoryDocumentIds.length === 0) nextErrors.category = "Category is required";
    if (!hasContent(form.content)) nextErrors.content = "Content is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast({ title: "Please check input data", variant: "error" });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const content = await resolveRichTextMediaBeforeSave(form.content);
      const resolvedItinerary = await Promise.all(
        itinerary.map(async (day) => ({
          label: day.label,
          title: day.title,
          description: day.description ? await resolveRichTextMediaBeforeSave(day.description) : "",
        })),
      );

      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content,
        destination: form.destination,
        duration: form.duration ? Number(form.duration) : null,
        price: form.price ? Number(form.price) : null,
        categories: form.categoryDocumentIds,
        tags: form.tagDocumentIds,
        author: form.authorId ? Number(form.authorId) : null,
        itinerary: resolvedItinerary,
      };

      if (mode === "edit" && documentId) {
        await updateTour(documentId, payload);
      } else {
        const created = await createTour(payload);
        if (mediaPendingId && created?.documentId) {
          await bulkUpdateEntityDocumentId(mediaPendingId, created.documentId);
        }
      }

      toast({ title: mode === "edit" ? "Tour updated" : "Tour created", variant: "success" });
      router.push("/tours");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to save tour";
      setError(message);
      if (message.includes("plugin::users-permissions.user")) {
        setErrors((prev) => ({ ...prev, author: "Author is invalid" }));
      }
      toast({
        title: "Failed to save tour",
        description: message.includes("plugin::users-permissions.user")
          ? "Selected author no longer exists. Please choose another author."
          : message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const onSelectAuthor = (user: UserItem) => {
    setForm((prev) => ({
      ...prev,
      authorId: String(user.id),
      authorLabel: `${user.username}${user.email ? ` (${user.email})` : ""}`,
    }));
    setErrors((prev) => ({ ...prev, author: undefined }));
  };

  const addItineraryItem = () => {
    setItinerary((prev) => [...prev, { label: "", title: "", description: "" }]);
  };

  const removeItineraryItem = (index: number) => {
    setItinerary((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItineraryItem = (index: number, field: keyof Omit<ItineraryDay, "id">, value: string) => {
    setItinerary((prev) => prev.map((day, i) => (i === index ? { ...day, [field]: value } : day)));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Services</span>
          <span>/</span>
          <span className="text-foreground font-medium">{mode === "edit" ? "Edit Tour" : "New Tour"}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{mode === "edit" ? "Edit Tour" : "Create Tour"}</h1>
        <p className="text-sm text-muted-foreground">Configure content, images, and itinerary for this tour.</p>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{mode === "edit" ? "Edit Tour" : "Create Tour"}</CardTitle>
          <Button variant="outline" asChild>
            <Link href="/tours">Back to list</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        {!loading && (
          <form className="space-y-3" onSubmit={onSubmit} noValidate>
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={activeTab === "content" ? "default" : "outline"} onClick={() => setActiveTab("content")}>Content</Button>
                <Button type="button" size="sm" variant={activeTab === "gallery" ? "default" : "outline"} onClick={() => setActiveTab("gallery")}>Image Gallery</Button>
                <Button type="button" size="sm" variant={activeTab === "itinerary" ? "default" : "outline"} onClick={() => setActiveTab("itinerary")}>Itinerary</Button>
              </div>

              {activeTab === "content" && (
                <div className="space-y-3">
                  <Input
                    placeholder="Title"
                    value={form.title}
                    className={errors.title ? "border-destructive focus-visible:ring-destructive/20" : ""}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      const nextSlug = slugTouched ? form.slug : slugify(nextTitle);
                      setForm((p) => ({ ...p, title: nextTitle, slug: nextSlug }));
                      setErrors((prev) => ({
                        ...prev,
                        title: nextTitle.trim() ? undefined : prev.title,
                        slug: nextSlug.trim() ? undefined : prev.slug,
                      }));
                    }}
                    required
                  />

                  <Input
                    placeholder="Slug"
                    value={form.slug}
                    className={errors.slug ? "border-destructive focus-visible:ring-destructive/20" : ""}
                    onChange={(e) => {
                      setSlugTouched(true);
                      const nextSlug = slugify(e.target.value);
                      setForm((p) => ({ ...p, slug: nextSlug }));
                      if (nextSlug.trim()) setErrors((prev) => ({ ...prev, slug: undefined }));
                    }}
                    required
                  />

                  <div className="flex items-center gap-2">
                    <Input
                      value={form.authorLabel}
                      placeholder="No author selected"
                      readOnly
                      className={errors.author ? "border-destructive focus-visible:ring-destructive/20" : ""}
                    />
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => setAuthorModalOpen(true)} title="Select author">
                      <Search />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => {
                        setForm((p) => ({ ...p, authorId: "", authorLabel: "" }));
                        setErrors((prev) => ({ ...prev, author: "Author is required" }));
                      }}
                      title="Clear author"
                      disabled={!form.authorId}
                    >
                      <UserX />
                    </Button>
                  </div>

                  <MultiSelectBox
                    options={categoryTreeOptions}
                    value={form.categoryDocumentIds}
                    className={errors.category ? "border-destructive focus-visible:ring-destructive/20" : ""}
                    onChange={(next) => {
                      setForm((p) => ({ ...p, categoryDocumentIds: next }));
                      if (next.length > 0) setErrors((prev) => ({ ...prev, category: undefined }));
                    }}
                    placeholder="Select categories"
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input
                      placeholder="Destination (e.g. Ha Noi)"
                      value={form.destination}
                      onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Duration (days)"
                      value={form.duration}
                      onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Price (VND)"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    />
                  </div>

                  <Textarea
                    placeholder="Excerpt (short description)"
                    rows={5}
                    className="min-h-32 resize-y"
                    value={form.excerpt}
                    onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  />

                  <RichTextEditor
                    value={form.content}
                    className={errors.content ? "border-destructive" : ""}
                    onChange={(content) => {
                      setForm((p) => ({ ...p, content }));
                      if (hasContent(content)) setErrors((prev) => ({ ...prev, content: undefined }));
                    }}
                    placeholder="Write tour description..."
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <TagPicker
                      selectedTagIds={form.tagDocumentIds}
                      onSelectedTagIdsChange={(ids) => setForm((p) => ({ ...p, tagDocumentIds: ids }))}
                    />
                  </div>
                </div>
              )}

              {activeTab === "gallery" && (
                <div className="space-y-2">
                  <EntityMediaManager
                    entityType="tour"
                    entityDocumentId={mode === "edit" ? documentId : mediaPendingId ?? undefined}
                    category="thumbnail"
                    multiple={false}
                    label="Featured Image"
                  />
                  <EntityMediaManager
                    entityType="tour"
                    entityDocumentId={mode === "edit" ? documentId : mediaPendingId ?? undefined}
                    category="gallery"
                    multiple={true}
                    maxFiles={20}
                    label="Image Gallery"
                  />
                </div>
              )}

              {activeTab === "itinerary" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Itinerary</h3>
                      <p className="text-xs text-muted-foreground">Example: Day 1, Morning, Day 2 - Afternoon</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addItineraryItem}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add item
                    </Button>
                  </div>

                  {itinerary.length === 0 && <p className="text-sm text-muted-foreground">No itinerary yet.</p>}

                  {itinerary.map((day, index) => (
                    <div key={index} className="rounded-md border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-8 text-sm font-medium"
                          placeholder="Label (e.g. Day 1, Morning)"
                          value={day.label}
                          onChange={(e) => updateItineraryItem(index, "label", e.target.value)}
                        />
                        <Button type="button" variant="destructive" size="icon-xs" onClick={() => removeItineraryItem(index)} title="Delete this item">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <Input
                        placeholder="Title (required)"
                        value={day.title}
                        onChange={(e) => updateItineraryItem(index, "title", e.target.value)}
                      />

                      <RichTextEditor
                        value={day.description ?? ""}
                        onChange={(value) => updateItineraryItem(index, "description", value)}
                        placeholder="Activity description..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </form>
        )}

        <PostAuthorPicker open={authorModalOpen} onClose={() => setAuthorModalOpen(false)} onSelect={onSelectAuthor} />
      </CardContent>
      </Card>
    </div>
  );
}
