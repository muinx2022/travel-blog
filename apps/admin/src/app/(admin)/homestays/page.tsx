"use client";

import { ResourceListPage } from "@/components/resource-list-page";
import {
  listHomestays,
  deleteHomestay,
  publishHomestay,
  unpublishHomestay,
  type HomestayItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { Home } from "lucide-react";

export default function HomestaysPage() {
  const columns = [
    {
      header: "ID",
      accessor: "id" as keyof HomestayItem,
      className: "w-[60px]",
    },
    {
      header: "Title",
      accessor: "title" as keyof HomestayItem,
      className: "w-[30%]",
    },
    {
      header: "City",
      accessor: "city" as keyof HomestayItem,
    },
    {
      header: "Category",
      accessor: (item: HomestayItem) => (item.categories ?? []).map((cat) => cat.name).join(", ") || "-",
    },
    {
      header: "Author",
      accessor: (item: HomestayItem) => item.author?.username ?? "Unknown",
    },
  ];

  const api = {
    list: listHomestays,
    delete: deleteHomestay,
    publish: publishHomestay,
    unpublish: unpublishHomestay,
  };

  return (
    <ResourceListPage<HomestayItem>
      resourceName="Homestay"
      resourceNamePlural="Homestays"
      api={api}
      columns={columns}
      canCreate={can("homestay", "create")}
      canUpdate={can("homestay", "update")}
      canDelete={can("homestay", "delete")}
      canPublish={can("homestay", "publish")}
      canUnpublish={can("homestay", "unpublish")}
      Icon={Home}
    />
  );
}
