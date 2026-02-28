"use client";

import { ResourceListPage } from "@/components/resource-list-page";
import {
  listHotels,
  deleteHotel,
  publishHotel,
  unpublishHotel,
  type HotelItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { Building2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={cn(
            "h-4 w-4",
            i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export default function HotelsPage() {
  const columns = [
    {
      header: "ID",
      accessor: "id",
      className: "w-[60px]",
    },
    {
      header: "Title",
      accessor: "title",
      className: "w-[25%]",
    },
    {
        header: "City",
        accessor: "city",
    },
    {
      header: "Rating",
      accessor: (item: HotelItem) => <StarRating rating={item.starRating} />,
      className: "w-[100px] text-center",
    },
    {
      header: "Category",
      accessor: (item: HotelItem) => (item.categories ?? []).map((cat) => cat.name).join(", ") || "-",
    },
    {
      header: "Author",
      accessor: (item: HotelItem) => item.author?.username ?? "Unknown",
    },
  ];

  const api = {
    list: listHotels,
    delete: deleteHotel,
    publish: publishHotel,
    unpublish: unpublishHotel,
  };

  return (
    <ResourceListPage<HotelItem>
      resourceName="Hotel"
      resourceNamePlural="Hotels"
      api={api}
      columns={columns}
      canCreate={can("hotel", "create")}
      canUpdate={can("hotel", "update")}
      canDelete={can("hotel", "delete")}
      canPublish={can("hotel", "publish")}
      canUnpublish={can("hotel", "unpublish")}
      Icon={Building2}
    />
  );
}
