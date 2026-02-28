"use client";

import { ResourceListPage } from "@/components/resource-list-page";
import {
  listTours,
  deleteTour,
  publishTour,
  unpublishTour,
  type TourItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { Map, Tag, Calendar } from "lucide-react";

export default function ToursPage() {
  const columns = [
    {
      header: "ID",
      accessor: "id" as keyof TourItem,
      className: "w-[60px]",
    },
    {
      header: "Title",
      accessor: (item: TourItem) => (
        <div>
          <p className="font-medium text-foreground">{item.title}</p>
          {(item.tags ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(item.tags ?? []).slice(0, 3).map((tag) => (
                <span
                  key={tag.documentId}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </span>
              ))}
              {(item.tags ?? []).length > 3 && (
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  +{(item.tags ?? []).length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      ),
      className: "w-[28%]",
    },
    {
      header: "Destination",
      accessor: (item: TourItem) => item.destination || "-",
    },
    {
        header: "Duration",
        accessor: (item: TourItem) => item.duration ? (
            <div className="flex items-center justify-center gap-1 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{item.duration} days</span>
            </div>
        ) : <span className="text-muted-foreground">-</span>,
        className: "w-[80px] text-center",
    },
    {
      header: "Category",
      accessor: (item: TourItem) => (item.categories ?? []).map((cat) => cat.name).join(", ") || "-",
    },
    {
      header: "Author",
      accessor: (item: TourItem) => item.author?.username ?? "Unknown",
    },
  ];

  const api = {
    list: listTours,
    delete: deleteTour,
    publish: publishTour,
    unpublish: unpublishTour,
  };

  return (
    <ResourceListPage<TourItem>
      resourceName="Tour"
      resourceNamePlural="Tours"
      api={api}
      columns={columns}
      canCreate={can("tour", "create")}
      canUpdate={can("tour", "update")}
      canDelete={can("tour", "delete")}
      canPublish={can("tour", "publish")}
      canUnpublish={can("tour", "unpublish")}
      Icon={Map}
    />
  );
}
