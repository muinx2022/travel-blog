"use client";

import { ResourceFormPage } from "@/components/resource-form-page";
import { getPost, createPost, updatePost } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  const fields = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", required: true },
    { name: "author", label: "Author", type: "author", required: true },
    { name: "categories", label: "Categories", type: "categories", required: true },
    { name: "excerpt", label: "Excerpt", type: "textarea" },
    { name: "content", label: "Content", type: "richtext", required: true },
  ];

  const initialFormState = {
    title: "",
    slug: "",
    excerpt: "",
    content: "<p></p>",
    categoryDocumentIds: [],
    authorId: "",
    authorLabel: "",
    thumbnailId: null,
    imageIds: [],
  };

  const api = {
    get: getPost,
    create: createPost,
    update: updatePost,
  };

  return (
    <ResourceFormPage
      mode="create"
      resourceName="Post"
      resourceNamePlural="Posts"
      api={api}
      fields={fields}
      initialFormState={initialFormState}
    />
  );
}
