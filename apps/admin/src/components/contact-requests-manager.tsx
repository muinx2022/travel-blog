"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Loader2, XCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  listContactRequests,
  updateContactRequest,
  type ContactRequestItem,
  type ContactRequestStatus,
  type PaginationMeta,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function ContactRequestsManager() {
  const canUpdate = can("contactRequest", "update");
  const [rows, setRows] = useState<ContactRequestItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ContactRequestStatus>("all");
  const [targetType, setTargetType] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listContactRequests(page, 10, { q, status, targetType });
      setRows(result.data);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load contact requests");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  const onChangeStatus = async (item: ContactRequestItem, nextStatus: ContactRequestStatus) => {
    try {
      setSavingId(item.documentId);
      const updated = await updateContactRequest(item.documentId, { status: nextStatus });
      setRows((prev) =>
        prev.map((row) => (row.documentId === item.documentId ? { ...row, status: updated.status } : row)),
      );
      toast({ title: "Status updated", variant: "success" });
    } catch (saveError) {
      toast({
        title: "Failed to update status",
        description: saveError instanceof Error ? saveError.message : undefined,
        variant: "error",
      });
    } finally {
      setSavingId(null);
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
            <span className="text-foreground font-medium">Contact Requests</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Contact Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer contact requests and inquiries</p>
        </div>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-sm font-semibold">Request List</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
            <input
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Filter requester/target..."
              value={q}
              onChange={(event) => {
                setPage(1);
                setQ(event.target.value);
              }}
            />
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={targetType}
              onChange={(event) => {
                setPage(1);
                setTargetType(event.target.value);
              }}
            >
              <option value="all">All target type</option>
              <option value="hotel">Hotel</option>
              <option value="tour">Tour</option>
              <option value="souvenir-shop">Shop</option>
              <option value="restaurant">Restaurant</option>
              <option value="homestay">Homestay</option>
              <option value="other">Other</option>
            </select>
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as "all" | ContactRequestStatus);
              }}
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading contact requests...</span>
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
                  <TableHead className="w-[80px] text-xs font-semibold uppercase tracking-wide">ID</TableHead>
                  <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wide">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Target</TableHead>
                  <TableHead className="w-[220px] text-xs font-semibold uppercase tracking-wide">Requester</TableHead>
                  <TableHead className="w-[220px] text-xs font-semibold uppercase tracking-wide">Message</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                  <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wide">Created</TableHead>
                  <TableHead className="w-[120px] text-right text-xs font-semibold uppercase tracking-wide">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.documentId} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{item.id}</TableCell>
                    <TableCell className="capitalize text-sm">{item.targetType}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{item.targetTitle ?? "-"}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{item.targetDocumentId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{item.requesterName}</p>
                      <p className="text-xs text-muted-foreground">{item.requesterEmail ?? "-"}</p>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <span className="line-clamp-3 text-sm text-muted-foreground">{item.message}</span>
                    </TableCell>
                    <TableCell>
                      {canUpdate ? (
                        <select
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          value={item.status}
                          onChange={(event) => onChangeStatus(item, event.target.value as ContactRequestStatus)}
                          disabled={savingId === item.documentId}
                        >
                          <option value="pending">Pending</option>
                          <option value="sent">Sent</option>
                          <option value="failed">Failed</option>
                        </select>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          item.status === "sent" 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : item.status === "failed"
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        )}>
                          {item.status === "sent" && <CheckCircle2 className="h-3 w-3" />}
                          {item.status === "failed" && <XCircle className="h-3 w-3" />}
                          {item.status === "pending" && <Clock className="h-3 w-3" />}
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          onClick={() => {/* View action */}}
                          title="View Details"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">No contact requests found</p>
                          <p className="text-xs text-muted-foreground mt-1">Contact requests will appear here when customers submit inquiries</p>
                        </div>
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
