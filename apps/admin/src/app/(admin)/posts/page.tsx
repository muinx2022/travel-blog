"use client";

import { ResourceListPage } from "@/components/resource-list-page";
import {
  listPosts,
  deletePost,
  publishPost,
  unpublishPost,
  type PostItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { FileText } from "lucide-react";

export default function PostsPage() {
  const columns = [
    {
      header: "ID",
      accessor: "id",
      className: "w-[60px]",
    },
    {
      header: "Title",
      accessor: "title",
      className: "w-[30%]",
    },
    {
      header: "Category",
      accessor: (item: PostItem) => (item.categories ?? []).map((cat) => cat.name).join(", ") || "-",
      className: "w-[18%]",
    },
    {
      header: "Author",
      accessor: (item: PostItem) => item.author?.username ?? "Unknown",
    },
    {
      header: "Created",
      accessor: (item: PostItem) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
        header: "Comments",
        accessor: (item: PostItem) => item.commentsCount ?? 0,
        className: "w-[60px] text-center",
    }
  ];

  const api = {
    list: listPosts,
    delete: deletePost,
    publish: publishPost,
    unpublish: unpublishPost,
  };

  return (
    <ResourceListPage<PostItem>
      resourceName="Post"
      resourceNamePlural="Posts"
      api={api}
      columns={columns}
      canCreate={can("post", "create")}
      canUpdate={can("post", "update")}
      canDelete={can("post", "delete")}
      canPublish={can("post", "publish")}
      canUnpublish={can("post", "unpublish")}
      Icon={FileText}
    />
  );
}
