"use client";

import { ResourceFormPage, type FormField } from "@/components/resource-form-page";
import { getHomestay, createHomestay, updateHomestay } from "@/lib/admin-api";

export default function NewHomestayPage() {
  const fields: FormField[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", required: true },
    { name: "author", label: "Author", type: "author", required: true },
    { name: "categories", label: "Categories", type: "categories", required: true },
    { name: "excerpt", label: "Excerpt", type: "textarea" },
    { name: "content", label: "Content", type: "richtext", required: true },
    { name: "address", label: "Address", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "priceRange", label: "Price Range", type: "text" },
  ];

  const initialFormState = {
    title: "",
    slug: "",
    excerpt: "",
    content: "<p></p>",
    address: "",
    city: "",
    priceRange: "",
    categoryDocumentIds: [],
    authorId: "",
    authorLabel: "",
    thumbnailId: null,
    imageIds: [],
  };

  const api = {
    get: getHomestay,
    create: createHomestay,
    update: updateHomestay,
  };

  return (
    <ResourceFormPage
      mode="create"
      resourceName="Homestay"
      resourceNamePlural="Homestays"
      api={api}
      fields={fields}
      initialFormState={initialFormState}
    />
  );
}
