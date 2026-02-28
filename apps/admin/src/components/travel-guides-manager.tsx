"use client";

import { BookOpen } from "lucide-react";
import {
  deleteTravelGuide,
  listTravelGuides,
  publishTravelGuide,
  unpublishTravelGuide,
  type TravelGuideItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { ResourceListPage } from "./resource-list-page";

const guideTypeLabels: Record<string, string> = {
  "cam-nang": "Cam nang",
  "meo-du-lich": "Meo",
  "lich-trinh-goi-y": "Lich trinh",
};

export function TravelGuidesManager() {
  const canCreate = can("travelGuide", "create");
  const canUpdate = can("travelGuide", "update");
  const canDelete = can("travelGuide", "delete");
  const canPublish = can("travelGuide", "publish");
  const canUnpublish = can("travelGuide", "unpublish");

  const api = {
    list: listTravelGuides,
    delete: deleteTravelGuide,
    publish: publishTravelGuide,
    unpublish: unpublishTravelGuide,
  };

  const columns = [
    {
      header: "Title",
      accessor: (item: TravelGuideItem) => (
        <div>
          <p className="font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.slug}</p>
          {(item.tags ?? []).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {(item.tags ?? []).slice(0, 4).map((tag) => (
                <span
                  key={tag.documentId}
                  className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (item: TravelGuideItem) => (
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
          {guideTypeLabels[item.guideType ?? "cam-nang"] ?? item.guideType ?? "-"}
        </span>
      ),
    },
    {
      header: "Author",
      accessor: (item: TravelGuideItem) => (
        <div className="text-sm text-muted-foreground">{item.author?.username || "-"}</div>
      ),
    },
    {
      header: "Date",
      accessor: (item: TravelGuideItem) => (
        <div className="text-sm text-muted-foreground">
          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-"}
        </div>
      ),
    },
  ];

  return (
    <ResourceListPage
      resourceName="Travel Guide"
      resourceNamePlural="Travel Guides"
      api={api}
      columns={columns}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
      canPublish={canPublish}
      canUnpublish={canUnpublish}
      Icon={BookOpen}
    />
  );
}
