"use client";

import React from "react";
import { ResourceFormPage } from "@/components/resource-form-page";
import { getHomestay, createHomestay, updateHomestay } from "@/lib/admin-api";

type Params = Promise<{ documentId: string }>;

export default function EditHomestayPage({ params }: { params: Params }) {
  const { documentId } = React.use(params);

  const fields = [
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
      mode="edit"
      documentId={documentId}
      resourceName="Homestay"
      resourceNamePlural="Homestays"
      api={api}
      fields={fields as any}
      initialFormState={initialFormState}
    />
  );
}
