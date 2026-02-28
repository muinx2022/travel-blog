"use client";

import { useState, useCallback, useEffect } from "react";
import { Post } from "@/lib/strapi";
import { PostCard } from "@/components/post-card";

export function InfinitePosts({
  initialPosts,
  initialTotal,
  categorySlug,
  tagSlug,
  pageSize = 10,
  totalOffset = 0,
}: {
  initialPosts: Post[];
  initialTotal: number;
  categorySlug?: string;
  tagSlug?: string;
  pageSize?: number;
  totalOffset?: number;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);

  useEffect(() => {
    setPosts(initialPosts);
    setPage(1);
    setLoading(false);
    setHasMore(initialPosts.length < initialTotal);
  }, [initialPosts, initialTotal, categorySlug, tagSlug]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      let url = `/api/posts-proxy?page=${nextPage}&pageSize=${pageSize}`;
      if (categorySlug) {
        url += `&category=${categorySlug}`;
      }
      if (tagSlug) {
        url += `&tag=${tagSlug}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [...prev, ...data.data]);
        setPage(nextPage);
        setHasMore(posts.length + data.data.length < data.meta.pagination.total - totalOffset);
      }
    } catch (error) {
      console.error("Failed to load more posts", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, posts.length, categorySlug, tagSlug, pageSize, totalOffset]);

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.documentId} post={post} />
      ))}
      
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Tải thêm"}
          </button>
        </div>
      )}
      {posts.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-4">Chưa có bài viết nào</div>
      )}
    </div>
  );
}
