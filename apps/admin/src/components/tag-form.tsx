"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTag, getTag, updateTag, type TagItem, type TagInput } from "@/lib/admin-api";
import { slugify } from "@/lib/slug";

type TagFormProps = {
  mode: "create" | "edit";
  documentId?: string;
};

const emptyForm: TagInput = {
  name: "",
  slug: "",
};

export function TagForm({ mode, documentId }: TagFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [form, setForm] = useState<TagInput>(emptyForm);

  useEffect(() => {
    if (mode === "edit" && documentId) {
      (async () => {
        try {
          const item = await getTag(documentId);
          setForm({
            name: item.name,
            slug: item.slug,
          });
        } catch (error) {
          toast({ title: error instanceof Error ? error.message : "Failed to load tag", variant: "error" });
          router.back();
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [mode, documentId, router]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!form.name?.trim()) errors.name = "Name is required";
    if (!form.slug?.trim()) errors.slug = "Slug is required";

    if (Object.keys(errors).length > 0) {
      toast({ title: "Please fill in all required fields", variant: "error" });
      return;
    }

    try {
      setSaving(true);
      if (mode === "create") {
        await createTag(form);
        toast({ title: "Tag created successfully", variant: "success" });
      } else if (documentId) {
        await updateTag(documentId, form);
        toast({ title: "Tag updated successfully", variant: "success" });
      }
      router.push("/tags");
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save tag", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Content</span>
          <span>/</span>
          <span className="text-foreground font-medium">{mode === "create" ? "New Tag" : "Edit Tag"}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{mode === "create" ? "New Tag" : "Edit Tag"}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "create" ? "Create a new location or topic tag" : "Update tag information"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Basic Information</CardTitle>
              <Button variant="outline" asChild>
                <Link href="/tags">Back to list</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., Tràng An, Hạ Long, Đà Nẵng"
                value={form.name ?? ""}
                onChange={(e) => {
                  const newName = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name: newName,
                    slug: slugify(newName),
                  }));
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Slug <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., trang-an, ha-long, da-nang"
                value={form.slug ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Auto-generated from name</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : mode === "create" ? "Create Tag" : "Update Tag"}
          </Button>
          <Link href="/tags">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );

}
