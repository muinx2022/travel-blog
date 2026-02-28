"use client";

import { ResourceFormPage } from "@/components/resource-form-page";
import { getSouvenirShop, createSouvenirShop, updateSouvenirShop } from "@/lib/admin-api";

export default function NewSouvenirShopPage() {
  const fields = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", required: true },
    { name: "author", label: "Author", type: "author", required: true },
    { name: "categories", label: "Categories", type: "categories", required: true },
    { name: "excerpt", label: "Excerpt", type: "textarea" },
    { name: "content", label: "Content", type: "richtext", required: true },
    { name: "address", label: "Address", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "shopType", label: "Shop Type", type: "text" },
  ];

  const initialFormState = {
    title: "",
    slug: "",
    excerpt: "",
    content: "<p></p>",
    address: "",
    city: "",
    shopType: "",
    categoryDocumentIds: [],
    authorId: "",
    authorLabel: "",
    thumbnailId: null,
    imageIds: [],
  };

  const api = {
    get: getSouvenirShop,
    create: createSouvenirShop,
    update: updateSouvenirShop,
  };

  return (
    <ResourceFormPage
      mode="create"
      resourceName="Souvenir Shop"
      resourceNamePlural="souvenir-shops"
      api={api}
      fields={fields as any}
      initialFormState={initialFormState}
    />
  );
}
