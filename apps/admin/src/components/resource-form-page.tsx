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
import { PostAuthorPicker } from "@/components/post-author-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import { listAllCategories, type CategoryItem } from "@/lib/admin-api";
import { resolveRichTextMediaBeforeSave } from "@/lib/richtext-media";
import { slugify } from "@/lib/slug";
import { EntityMediaManager, generatePendingId } from "@/components/entity-media-manager";
import { bulkUpdateEntityDocumentId } from "@/lib/entity-media-api";

export type FormField = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  render?: (form: any, setForm: any) => React.ReactNode;
};

type ResourceFormPageProps = {
  mode: "create" | "edit";
  documentId?: string;
  resourceName: string;
  resourceNamePlural: string;
  api: {
    get: (documentId: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (documentId: string, data: any) => Promise<any>;
  };
  fields: FormField[];
  initialFormState: any;
};

function hasContent(value: string) {
  const text = value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  if (text.length > 0) return true;
  return /<(img|iframe|video|figure|embed)\b/i.test(value);
}

export function ResourceFormPage({
  mode,
  documentId,
  resourceName,
  resourceNamePlural,
  api,
  fields,
  initialFormState,
}: ResourceFormPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialFormState);
  const [categoryOptions, setCategoryOptions] = useState<CategoryItem[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "gallery">("content");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
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
          const data = await api.get(documentId);
          setForm(data);
          setSlugTouched(false);
        } else {
          setForm(initialFormState);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : `Failed to load ${resourceName.toLowerCase()}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [mode, documentId, api, initialFormState, resourceName]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: Partial<Record<string, string>> = {};
    for (const field of fields) {
        if (field.required) {
            if (field.type === 'richtext' && !hasContent(form[field.name])) {
                nextErrors[field.name] = `${field.label} is required`;
            } else if (Array.isArray(form[field.name]) && form[field.name].length === 0) {
                nextErrors[field.name] = `${field.label} is required`;
            } else if (!form[field.name]) {
                nextErrors[field.name] = `${field.label} is required`;
            }
        }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: "Please fix the errors below", variant: "error" });
      return;
    }

    try {
      setSaving(true);
      const contentField = fields.find(f => f.type === 'richtext');
      const content = contentField ? await resolveRichTextMediaBeforeSave(form[contentField.name]) : undefined;
      
      const payload = { ...form };
      if (content) {
        payload[contentField!.name] = content;
      }
      if (payload.authorId) {
        payload.author = Number(payload.authorId) || null;
      }
      if (payload.categoryDocumentIds) {
        payload.categories = payload.categoryDocumentIds;
      }

      let result;
      if (mode === "create") {
        result = await api.create(payload);
      } else {
        if (!documentId) throw new Error("Missing documentId");
        result = await api.update(documentId, payload);
      }

      if (mediaPendingId && result.documentId) {
        await bulkUpdateEntityDocumentId(mediaPendingId, result.documentId, resourceName.toLowerCase());
      }

      toast({ title: mode === "create" ? `${resourceName} created successfully` : `${resourceName} updated successfully`, variant: "success" });
      router.push(`/${resourceNamePlural.toLowerCase()}`);
    } catch (submitError) {
      toast({ title: submitError instanceof Error ? submitError.message : `Failed to save ${resourceName.toLowerCase()}`, variant: "error" });
    } finally {
      setSaving(false);
    }
  };
  
  const renderField = (field: FormField) => {
    switch(field.type) {
      case "text":
        return <Input placeholder={field.label} value={form[field.name]} onChange={(e) => setForm((f: any) => ({ ...f, [field.name]: e.target.value }))} />;
      case "slug":
        return (
            <Input
                placeholder="Slug"
                value={form.slug}
                onChange={(e) => {
                    setForm((f: any) => ({ ...f, slug: e.target.value }));
                    setSlugTouched(true);
                }}
            />
        );
      case "textarea":
        return <Textarea placeholder={field.label} value={form[field.name]} onChange={(e) => setForm((f: any) => ({ ...f, [field.name]: e.target.value }))} rows={3} />;
      case "richtext":
        return <RichTextEditor value={form[field.name]} onChange={(content) => setForm((f: any) => ({ ...f, [field.name]: content }))} pendingId={mediaPendingId} />;
      case "author":
        return (
            <div className="flex items-center gap-2">
                <Input value={form.authorLabel} placeholder="No author selected" readOnly />
                <Button type="button" variant="outline" size="sm" onClick={() => setAuthorModalOpen(true)}>Select</Button>
                {form.authorId && (
                <Button type="button" variant="outline" size="icon-sm" onClick={() => setForm((f: any) => ({ ...f, authorId: "", authorLabel: "" }))}>
                    <UserX className="h-4 w-4" />
                </Button>
                )}
          </div>
        )
      case "categories":
        return (
            <MultiSelectBox
                options={categoryTreeOptions}
                value={form.categoryDocumentIds}
                onChange={(ids) => setForm((f: any) => ({ ...f, categoryDocumentIds: ids }))}
                placeholder="Select categories"
            />
        )
      case "custom":
        return field.render ? field.render(form, setForm) : null;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Content</span>
          <span>/</span>
          <span className="text-foreground font-medium">{mode === "edit" ? `Edit ${resourceName}` : `New ${resourceName}`}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{mode === "edit" ? `Edit ${resourceName}` : `Create ${resourceName}`}</h1>
        <p className="text-sm text-muted-foreground">Fill in {resourceName.toLowerCase()} details and media.</p>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{mode === "edit" ? `Edit ${resourceName}` : `Create ${resourceName}`}</CardTitle>
          <Button variant="outline" asChild>
            <Link href={`/${resourceNamePlural.toLowerCase()}`}>Back to list</Link>
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
                  {fields.filter(f => f.type !== 'media').map(field => (
                    <div key={field.name}>
                        {renderField(field)}
                        {errors[field.name] && <p className="text-sm text-destructive mt-1">{errors[field.name]}</p>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "gallery" && (
                <div className="space-y-2">
                  <EntityMediaManager
                    mode={resourceName.toLowerCase() as any}
                    pendingId={mediaPendingId}
                    selectedThumbnailId={form.thumbnailId}
                    onSelectThumbnail={(id) => setForm((f: any) => ({ ...f, thumbnailId: id }))}
                    selectedImageIds={form.imageIds}
                    onSelectImages={(ids) => setForm((f: any) => ({ ...f, imageIds: ids }))}
                  />
                </div>
              )}
            </div>

            <PostAuthorPicker
              open={authorModalOpen}
              onOpenChange={setAuthorModalOpen}
              onSelect={(user) => {
                setForm((f: any) => ({
                  ...f,
                  authorId: String(user.id),
                  authorLabel: `${user.username}${user.email ? ` (${user.email})` : ""}`,
                }));
                setAuthorModalOpen(false);
              }}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : mode === "create" ? `Create ${resourceName}` : `Update ${resourceName}`}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${resourceNamePlural.toLowerCase()}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      </Card>
    </div>
  );
}
