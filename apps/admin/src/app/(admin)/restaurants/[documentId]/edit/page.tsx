"use client";

import React from "react";
import { ResourceFormPage } from "@/components/resource-form-page";
import { getRestaurant, createRestaurant, updateRestaurant } from "@/lib/admin-api";

type Params = Promise<{ documentId: string }>;

export default function EditRestaurantPage({ params }: { params: Params }) {
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
    { name: "cuisineType", label: "Cuisine Type", type: "text" },
    { name: "priceRange", label: "Price Range", type: "text" },
  ];

  const initialFormState = {
    title: "",
    slug: "",
    excerpt: "",
    content: "<p></p>",
    address: "",
    city: "",
    cuisineType: "",
    priceRange: "",
    categoryDocumentIds: [],
    authorId: "",
    authorLabel: "",
    thumbnailId: null,
    imageIds: [],
  };

  const api = {
    get: getRestaurant,
    create: createRestaurant,
    update: updateRestaurant,
  };

  return (
    <ResourceFormPage
      mode="edit"
      documentId={documentId}
      resourceName="Restaurant"
      resourceNamePlural="Restaurants"
      api={api}
      fields={fields as any}
      initialFormState={initialFormState}
    />
  );
}
