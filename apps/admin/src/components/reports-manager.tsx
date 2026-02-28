"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Eye, Flag } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
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
import {
  deleteReport,
  listReports,
  type PaginationMeta,
  type ReportItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function ReportsManager() {
  const canDelete = can("report", "delete");
  const [rows, setRows] = useState<ReportItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [targetType, setTargetType] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listReports(page, 10, { q, targetType });
      setRows(result.data);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, q, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (item: ReportItem) => {
    if (!confirm("Delete this report record?")) return;
    try {
      await deleteReport(item.documentId);
      toast({ title: "Report deleted", variant: "success" });
      await load();
    } catch (deleteError) {
      toast({
        title: "Failed to delete report",
        description: deleteError instanceof Error ? deleteError.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Management</span>
            <span>/</span>
            <span className="text-foreground font-medium">Reports</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user reports and flagged content</p>
        </div>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-6">
        <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px]">
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            placeholder="Filter target..."
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
              setTargetType(event.target.value);
            }}
          >
            <option value="all">All target type</option>
            <option value="post">Post</option>
            <option value="comment">Comment</option>
            <option value="hotel">Hotel</option>
            <option value="tour">Tour</option>
            <option value="souvenir-shop">Shop</option>
            <option value="restaurant">Restaurant</option>
            <option value="homestay">Homestay</option>
            <option value="other">Other</option>
          </select>
        </div>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
          <Table className="[&_td]:align-top [&_td]:break-words [&_td]:whitespace-normal">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="w-[220px]">Reporter</TableHead>
                <TableHead className="w-[180px]">Created</TableHead>
                <TableHead className="w-[120px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.documentId} className="group relative">

                <TableCell>{item.id}</TableCell>
                <TableCell className="capitalize">{item.targetType}</TableCell>
                <TableCell className="font-mono text-xs">{item.targetDocumentId}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.user?.username ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">{item.user?.email ?? "-"}</p>
                  </div>
                </TableCell>
                  <TableCell>
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                        <IconAction 
                          label="View report" 
                          icon={<Eye className="h-4 w-4" />} 
                          href={`/reports/${item.documentId}/view`} 
                          variant="ghost"
                        />
                        {canDelete && (
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            onClick={() => onDelete(item)}
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
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No reports yet.
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
