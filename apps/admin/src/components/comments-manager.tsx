"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2, Eye, CheckCircle2, XCircle, MessageSquare } from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconAction } from "@/components/icon-action";
import { PaginationControls } from "@/components/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  deleteComment,
  listComments,
  publishComment,
  unpublishComment,
  type CommentItem,
  type PaginationMeta,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";


function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function CommentsManager() {
  const canCreate = can("comment", "create");
  const canUpdate = can("comment", "update");
  const canDelete = can("comment", "delete");
  const canPublish = can("comment", "publish");
  const canUnpublish = can("comment", "unpublish");
  const canTogglePublish = canPublish || canUnpublish;

  const [rows, setRows] = useState<CommentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingDocumentId, setTogglingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [targetType, setTargetType] = useState<"all" | CommentItem["targetType"]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listComments(page, 10, { q, status, targetType });
      setRows(result.data);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (item: CommentItem) => {
    if (!confirm(`Delete comment by "${item.authorName}"?`)) {
      return;
    }
    try {
      setDeletingDocumentId(item.documentId);
      await deleteComment(item.documentId);
      toast({ title: "Comment deleted", variant: "success" });
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete comment");
      toast({
        title: "Failed to delete comment",
        description: deleteError instanceof Error ? deleteError.message : undefined,
        variant: "error",
      });
    } finally {
      setDeletingDocumentId(null);
    }
  };


  const onTogglePublished = async (item: CommentItem) => {
    try {
      setTogglingDocumentId(item.documentId);
      if (item.publishedAt) {
        const updated = await unpublishComment(item.documentId);
        setRows((prev) => prev.map((row) => (
          row.documentId === item.documentId
            ? { ...row, publishedAt: updated.publishedAt ?? null, updatedAt: updated.updatedAt }
            : row
        )));
        toast({ title: "Comment moved to draft", variant: "success" });
      } else {
        const updated = await publishComment(item.documentId);
        setRows((prev) => prev.map((row) => (
          row.documentId === item.documentId
            ? { ...row, publishedAt: updated.publishedAt ?? null, updatedAt: updated.updatedAt }
            : row
        )));
        toast({ title: "Comment published", variant: "success" });
      }
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to change publish status");
      toast({
        title: "Failed to change status",
        description: toggleError instanceof Error ? toggleError.message : undefined,
        variant: "error",
      });
    } finally {
      setTogglingDocumentId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Content</span>
            <span>/</span>
            <span className="text-foreground font-medium">Comments</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Comments
          </h1>

          <p className="text-sm text-muted-foreground mt-1">Manage moderation and publication state</p>
        </div>
        {canCreate && (
          <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Link href="/comments/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Comment
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-6">

        <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px_180px]">
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            placeholder="Filter author/content..."
            value={q}
            onChange={(event) => {
              setPage(1);
              setQ(event.target.value);
            }}
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={targetType}
            onChange={(event) => {
              setPage(1);
              setTargetType(event.target.value as "all" | CommentItem["targetType"]);
            }}
          >
            <option value="all">All type</option>
            <option value="post">Post</option>
            <option value="page">Page</option>
            <option value="product">Product</option>
            <option value="hotel">Hotel</option>
            <option value="tour">Tour</option>
            <option value="other">Other</option>
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as "all" | "draft" | "published");
            }}
          >
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Table className="[&_td]:align-top [&_td]:break-words [&_td]:whitespace-normal">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">ID</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[220px]">Author</TableHead>
              <TableHead className="w-[170px]">Created</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[120px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.documentId} className="group relative">

                <TableCell>{item.id}</TableCell>
                <TableCell className="capitalize">{item.targetType}</TableCell>
                <TableCell>{item.targetTitle ?? item.targetDocumentId}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.authorName}</p>
                    <p className="text-xs text-muted-foreground">{item.authorEmail || "-"}</p>
                  </div>
                </TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell className="text-center">
                  {canTogglePublish ? (
                    <button
                      type="button"
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        item.publishedAt 
                          ? "bg-emerald-500 hover:bg-emerald-600" 
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/40"
                      )}
                      onClick={() => onTogglePublished(item)}
                      disabled={togglingDocumentId === item.documentId}
                      title={item.publishedAt ? "Click to unpublish" : "Click to publish"}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
                          item.publishedAt ? "translate-x-5" : "translate-x-0.5"
                        )}
                      />
                      <span className="sr-only">{item.publishedAt ? "Published" : "Draft"}</span>
                    </button>
                  ) : (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      item.publishedAt 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      {item.publishedAt ? (
                        <><CheckCircle2 className="h-3 w-3" /> Published</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Draft</>
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                      <IconAction 
                        label="View comment" 
                        icon={<Eye className="h-4 w-4" />} 
                        href={`/comments/${item.documentId}/view`} 
                        variant="ghost"
                      />
                      {canUpdate && (
                        <IconAction 
                          label="Edit comment" 
                          icon={<Pencil className="h-4 w-4" />} 
                          href={`/comments/${item.documentId}/edit`} 
                          variant="ghost"
                        />
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          onClick={() => onDelete(item)}
                          disabled={deletingDocumentId === item.documentId}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                  </div>
                </TableCell>

              </TableRow>

            ))}
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No comments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
          <PaginationControls
            page={pagination.page}
            pageCount={pagination.pageCount}
            total={pagination.total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
