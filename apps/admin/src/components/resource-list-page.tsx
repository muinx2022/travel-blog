"use client";

import React, { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Eye, Pencil, Plus, Trash2, Search, Filter, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { listAllCategories, type CategoryItem, type PaginatedResult, type PaginationMeta } from "@/lib/admin-api";

type TreeCategory = CategoryItem & { children: TreeCategory[] };

type ResourceItem = {
  id: number;
  documentId: string;
  title: string;
  publishedAt?: string | null;
  [key: string]: any;
};

type Api<T extends ResourceItem> = {
  list: (page: number, pageSize: number, filters: Record<string, any>) => Promise<PaginatedResult<T>>;
  delete: (documentId: string) => Promise<any>;
  publish: (documentId: string) => Promise<any>;
  unpublish: (documentId: string) => Promise<any>;
};

type Column<T extends ResourceItem> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
};

type ResourceListPageProps<T extends ResourceItem> = {
  resourceName: string;
  resourceNamePlural: string;
  api: Api<T>;
  columns: Column<T>[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
  Icon: React.ElementType;
};

function buildCategoryTree(categories: CategoryItem[]) {
  const map = new Map<number, TreeCategory>();
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: TreeCategory[] = [];

  for (const cat of categories) {
    const node = map.get(cat.id);
    if (node) {
      if (cat.parent?.id && map.has(cat.parent.id)) {
        map.get(cat.parent.id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }
  return roots;
}

function CategoryOptions({ nodes, level = 0 }: { nodes: TreeCategory[]; level?: number }) {
  return (
    <>
      {nodes.map((node) => (
        <Fragment key={node.id}>
          <option value={node.documentId}>
            {"\u00A0".repeat(level * 4)}
            {node.name}
          </option>
          {node.children.length > 0 && <CategoryOptions nodes={node.children} level={level + 1} />}
        </Fragment>
      ))}
    </>
  );
}

export function ResourceListPage<T extends ResourceItem>({
  resourceName,
  resourceNamePlural,
  api,
  columns,
  canCreate,
  canUpdate,
  canDelete,
  canPublish,
  canUnpublish,
  Icon,
}: ResourceListPageProps<T>) {
  const canTogglePublish = canPublish || canUnpublish;

  const [rows, setRows] = useState<T[]>([]);
  const [categories, setCategories] = useState<TreeCategory[]>([]);
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
  const [qInput, setQInput] = useState("");
  const [statusInput, setStatusInput] = useState<"all" | "draft" | "published">("all");
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [filters, setFilters] = useState({
    q: "",
    status: "all" as "all" | "draft" | "published",
    category: "",
  });

  useEffect(() => {
    listAllCategories().then((cats) => {
      setCategories(buildCategoryTree(cats));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.list(page, 10, filters);
      setRows(result.data);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `Failed to load ${resourceNamePlural.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [page, filters, api, resourceNamePlural]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (item: T) => {
    if (!confirm(`Delete ${resourceName.toLowerCase()} "${item.title}"?`)) {
      return;
    }
    try {
      setDeletingDocumentId(item.documentId);
      await api.delete(item.documentId);
      toast({ title: `${resourceName} deleted`, variant: "success" });
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Failed to delete ${resourceName.toLowerCase()}`);
      toast({
        title: `Failed to delete ${resourceName.toLowerCase()}`,
        description: deleteError instanceof Error ? deleteError.message : undefined,
        variant: "error",
      });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const onTogglePublished = async (item: T) => {
    try {
      setTogglingDocumentId(item.documentId);
      const updated = item.publishedAt
        ? await api.unpublish(item.documentId)
        : await api.publish(item.documentId);

      setRows((prev) => {
        const next = prev.map((row) =>
          row.documentId === item.documentId
            ? { ...row, publishedAt: updated.publishedAt ?? null, updatedAt: updated.updatedAt }
            : row,
        );
        if (filters.status === "published" && !updated.publishedAt) {
          return next.filter((row) => row.documentId !== item.documentId);
        }
        if (filters.status === "draft" && updated.publishedAt) {
          return next.filter((row) => row.documentId !== item.documentId);
        }
        return next;
      });
      toast({
        title: updated.publishedAt ? `${resourceName} published` : `${resourceName} moved to draft`,
        variant: "success",
      });
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

  const onApplyFilters = () => {
    setPage(1);
    setFilters({
      q: qInput,
      status: statusInput,
      category: categoryInput,
    });
  };

  const onResetFilters = () => {
    setQInput("");
    setStatusInput("all");
    setCategoryInput("");
    setPage(1);
    setFilters({
      q: "",
      status: "all",
      category: "",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Content</span>
            <span>/</span>
            <span className="text-foreground font-medium">{resourceNamePlural}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Icon className="h-6 w-6 text-primary" />
            {resourceNamePlural}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your {resourceNamePlural.toLowerCase()}
          </p>
        </div>
        {canCreate && (
          <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Link href={`/${resourceNamePlural.toLowerCase()}/new`} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create {resourceName}
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md gap-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 h-10"
                placeholder="Search by title, slug, excerpt..."
                value={qInput}
                onChange={(event) => setQInput(event.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value)}
            >
              <option value="">All categories</option>
              <CategoryOptions nodes={categories} />
            </select>
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={statusInput}
              onChange={(event) =>
                setStatusInput(event.target.value as "all" | "draft" | "published")
              }
            >
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={onApplyFilters} className="gap-2">
              <Search className="h-4 w-4" />
              Apply Filters
            </Button>
            <Button type="button" variant="outline" onClick={onResetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading {resourceNamePlural.toLowerCase()}...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && (
            <Table className="[&_td]:align-top [&_td]:break-words [&_td]:whitespace-normal">
              <TableHeader>
                <TableRow>
                  {columns.map((col, index) => (
                    <TableHead key={index} className={col.className}>{col.header}</TableHead>
                  ))}
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.documentId} className="group relative">
                    {columns.map((col, index) => (
                      <TableCell key={index} className={col.className}>
                        {typeof col.accessor === 'function'
                          ? col.accessor(item)
                          : String(item[col.accessor as keyof T])}
                      </TableCell>
                    ))}
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
                            label={`View ${resourceName.toLowerCase()}`} 
                            icon={<Eye className="h-4 w-4" />} 
                            href={`/${resourceNamePlural.toLowerCase()}/${item.documentId}/view`}
                            variant="ghost"
                          />
                          {canUpdate && (
                            <IconAction 
                              label={`Edit ${resourceName.toLowerCase()}`}
                              icon={<Pencil className="h-4 w-4" />} 
                              href={`/${resourceNamePlural.toLowerCase()}/${item.documentId}/edit`}
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
                    <TableCell colSpan={columns.length + 2} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">No {resourceNamePlural.toLowerCase()} found</p>
                          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or create a new {resourceName.toLowerCase()}</p>
                        </div>
                        {canCreate && (
                          <Button asChild size="sm" className="mt-2">
                            <Link href={`/${resourceNamePlural.toLowerCase()}/new`}>
                              <Plus className="h-4 w-4 mr-1" />
                              Create {resourceName}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
