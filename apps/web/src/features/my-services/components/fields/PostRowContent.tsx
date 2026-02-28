"use client";

import { MyPostRowCard } from "@/components/my-post-row-card";
import type { Post } from "@/lib/strapi";

type MyPostRow = Post & {
  status?: "draft" | "published";
};

export function PostRowContent({ post }: { post: MyPostRow }) {
  return <MyPostRowCard post={post} />;
}

