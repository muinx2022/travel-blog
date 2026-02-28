"use client";

import Link from "next/link";
import { Fragment, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor";
import { createCategory, getCategory, listAllCategories, updateCategory, type CategoryItem } from "@/lib/admin-api";
import { resolveRichTextMediaBeforeSave } from "@/lib/richtext-media";
import { slugify } from "@/lib/slug";

type CategoryFormProps = {
  mode: "create" | "edit";
  documentId?: string;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "<p></p>",
  parentDocumentId: "",
};
type CategoryField = "name" | "slug";
type CategoryErrors = Partial<Record<CategoryField, string>>;
type TreeCategory = CategoryItem & { children: TreeCategory[] };

function buildCategoryTree(categories: CategoryItem[]) {
  const map = new Map<number, TreeCategory>();
  categories.forEach((category) => map.set(category.id, { ...category, children: [] }));
  const roots: TreeCategory[] = [];

  for (const category of categories) {
    const node = map.get(category.id);
    if (!node) {
      continue;
    }
    if (category.parent?.id && map.has(category.parent.id)) {
      map.get(category.parent.id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function collectDescendantDocumentIds(targetId: number, categories: CategoryItem[]) {
  const childrenByParentId = new Map<number, CategoryItem[]>();
  for (const item of categories) {
    const parentId = item.parent?.id;
    if (!parentId) {
      continue;
    }
    const bucket = childrenByParentId.get(parentId) ?? [];
    bucket.push(item);
    childrenByParentId.set(parentId, bucket);
  }

  const blocked = new Set<string>();
  const queue: number[] = [targetId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const children = childrenByParentId.get(current) ?? [];
    for (const child of children) {
      if (!blocked.has(child.documentId)) {
        blocked.add(child.documentId);
        queue.push(child.id);
      }
    }
  }

  return blocked;
}

function CategoryOptions({ nodes, level = 0 }: { nodes: TreeCategory[]; level?: number }) {
  return (
    <>
      {nodes.map((node) => (
        <Fragment key={node.documentId}>
          <option value={node.documentId}>
            {"\u00A0".repeat(level * 4)}
            {node.name}
          </option>
          {node.children.length > 0 && <CategoryOptions nodes={node.children} level={level + 1} />}
        </Fragment>
      ))}
    </>
  );
}

export function CategoryForm({ mode, documentId }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [parentOptions, setParentOptions] = useState<TreeCategory[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<CategoryErrors>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const categories = await listAllCategories();
        const sortedCategories = [...categories].sort(
          (a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
            a.name.localeCompare(b.name),
        );
        let allowedCategories = sortedCategories;

        if (mode === "edit" && documentId) {
          const category = await getCategory(documentId);
          const blockedDocumentIds = collectDescendantDocumentIds(category.id, sortedCategories);
          blockedDocumentIds.add(category.documentId);
          allowedCategories = sortedCategories.filter((item) => !blockedDocumentIds.has(item.documentId));
          setForm({
            name: category.name ?? "",
            slug: category.slug ?? "",
            description: category.description ?? "<p></p>",
            parentDocumentId: category.parent?.documentId ?? "",
          });
          setSlugTouched(false);
        } else {
          setForm(emptyForm);
        }

        setParentOptions(buildCategoryTree(allowedCategories));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load category");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [mode, documentId]);

  const validateForm = () => {
    const nextErrors: CategoryErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = "Name is required";
    }
    if (!form.slug.trim()) {
      nextErrors.slug = "Slug is required";
    }
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
      const description = await resolveRichTextMediaBeforeSave(form.description);
      const payload = {
        name: form.name,
        slug: form.slug,
        description,
        parent: form.parentDocumentId || null,
      };
      if (mode === "edit" && documentId) {
        await updateCategory(documentId, payload);
      } else {
        await createCategory(payload);
      }
      toast({
        title: mode === "edit" ? "Category updated" : "Category created",
        variant: "success",
      });
      router.push("/categories");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save category");
      toast({
        title: "Failed to save category",
        description: submitError instanceof Error ? submitError.message : undefined,
        variant: "error",
      });
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
          <span className="text-foreground font-medium">{mode === "edit" ? "Edit Category" : "New Category"}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{mode === "edit" ? "Edit Category" : "Create Category"}</h1>
        <p className="text-sm text-muted-foreground">Manage category hierarchy and details.</p>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{mode === "edit" ? "Edit Category" : "Create Category"}</CardTitle>
            <Button variant="outline" asChild>
              <Link href="/categories">Back to list</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          {!loading && (
          <form className="space-y-3" onSubmit={onSubmit} noValidate>
            <Input
              placeholder="Name"
              value={form.name}
              className={errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}
              onChange={(event) =>
                setForm((p) => ({
                  ...p,
                  name: event.target.value,
                  slug: slugTouched ? p.slug : slugify(event.target.value),
                }))
              }
              onBlur={() => {
                if (!form.name.trim()) {
                  setErrors((prev) => ({ ...prev, name: "Name is required" }));
                } else {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              required
            />
            <Input
              placeholder="Slug"
              value={form.slug}
              className={errors.slug ? "border-destructive focus-visible:ring-destructive/20" : ""}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, slug: slugify(event.target.value) }));
              }}
              onBlur={() => {
                if (!form.slug.trim()) {
                  setErrors((prev) => ({ ...prev, slug: "Slug is required" }));
                } else {
                  setErrors((prev) => ({ ...prev, slug: undefined }));
                }
              }}
              required
            />
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.parentDocumentId}
              onChange={(event) =>
                setForm((p) => ({ ...p, parentDocumentId: event.target.value }))
              }
            >
              <option value="">No parent</option>
              <CategoryOptions nodes={parentOptions} />
            </select>
            <RichTextEditor
              value={form.description}
              onChange={(description) => setForm((p) => ({ ...p, description }))}
              placeholder="Category description..."
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
