"use client";

import { Tag } from "lucide-react";
import { tagsApi, type TagItem } from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { ResourceListPage } from "./resource-list-page";

export function TagsManager() {
  const canCreate = can("tag", "create");
  const canUpdate = can("tag", "update");
  const canDelete = can("tag", "delete");
  const canPublish = can("tag", "publish");
  const canUnpublish = can("tag", "unpublish");

  const api = {
    ...tagsApi,
    list: async (page: number, pageSize: number, filters: Record<string, any>) => {
      const result = await tagsApi.list(page, pageSize, filters);
      return {
        ...result,
        data: result.data.map((tag) => ({ ...tag, title: tag.name })),
      };
    },
  };

  const columns = [
    {
      header: "Tag",
      accessor: (item: TagItem) => (
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.slug}</p>
        </div>
      ),
    },
    {
      header: "Count",
      accessor: (item: TagItem) => (
        <div className="text-xs text-muted-foreground leading-5">
          <div>Posts: {item.postsCount ?? 0}</div>
          <div>Tours: {item.toursCount ?? 0}</div>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: (item: TagItem) => (
        <div className="text-xs text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
        </div>
      ),
    },
  ];

  return (
    <ResourceListPage
      resourceName="Tag"
      resourceNamePlural="Tags"
      api={api}
      columns={columns}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
      canPublish={canPublish}
      canUnpublish={canUnpublish}
      Icon={Tag}
    />
  );
}
