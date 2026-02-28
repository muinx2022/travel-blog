"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, BookOpen, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconAction } from "@/components/icon-action";
import { PaginationControls } from "@/components/pagination-controls";
import { deleteContentPage, listContentPages, type ContentPageItem, type PaginatedResult } from "@/lib/admin-api";

export function ContentPagesManager() {
  const canCreate = true;
  const canUpdate = true;
  const canDelete = true;

  const [items, setItems] = useState<ContentPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, pageCount: 1, total: 0 });

  const loadPages = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);
        const result: PaginatedResult<ContentPageItem> = await listContentPages(pageNum, 10, searchQuery);
        setItems(result.data);
        setPagination(result.pagination);
        setPage(pageNum);
      } catch (error) {
        toast({ title: error instanceof Error ? error.message : "Failed to load content pages", variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    void loadPages(1);
  }, [loadPages]);

  const onDelete = useCallback(
    async (item: ContentPageItem) => {
      if (!confirm(`Delete page "${item.title}"?`)) {
        return;
      }
      try {
        await deleteContentPage(item.documentId);
        toast({ title: "Content page deleted", variant: "success" });
        await loadPages(page);
      } catch (error) {
        toast({ title: error instanceof Error ? error.message : "Failed to delete page", variant: "error" });
      }
    },
    [page, loadPages],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Content</span>
            <span>/</span>
            <span className="text-foreground font-medium">Content Pages</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Content Pages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pages such as introduction, rules and policy</p>
        </div>
        {canCreate && (
          <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Link href="/content-pages/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Page
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 h-10"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-sm font-semibold">
            {pagination.total} {pagination.total === 1 ? "page" : "pages"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No content pages found</p>
                <p className="text-xs text-muted-foreground mt-1">{searchQuery ? "Try adjusting your search" : "Create your first page to get started"}</p>
              </div>
              {canCreate && !searchQuery && (
                <Button asChild size="sm" className="mt-2">
                  <Link href="/content-pages/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Page
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {items.map((item) => (
                <div key={item.documentId} className="group relative flex items-center justify-between gap-4 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">/{item.slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Header: {item.showInHeader ? "Yes" : "No"} · Footer: {item.showInFooter ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {canUpdate && <IconAction icon={<Pencil className="h-4 w-4" />} label="Edit" href={`/content-pages/${item.documentId}/edit`} variant="ghost" />}
                    {canDelete && (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(item)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

            </div>
          )}
          
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
