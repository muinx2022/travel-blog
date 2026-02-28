"use client";

import Link from "next/link";
import { Ban, Pencil, Plus, Shield, Loader2, RotateCcw, Trash2, Users, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconAction } from "@/components/icon-action";
import { PaginationControls } from "@/components/pagination-controls";
import { deleteUser, listUsers, updateUser, type PaginationMeta, type UserItem } from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";


export function UsersManager() {
  const canCreate = can("user", "create");
  const canUpdate = can("user", "update");
  const canDelete = can("user", "delete");

  const [rows, setRows] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [banSubmitting, setBanSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listUsers(page, 10);
      setRows(result.data);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (item: UserItem) => {
    if (!confirm(`Delete user "${item.username}"?`)) {
      return;
    }
    try {
      await deleteUser(item.id);
      toast({ title: "User deleted", variant: "success" });
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete user");
      toast({
        title: "Failed to delete user",
        description: deleteError instanceof Error ? deleteError.message : undefined,
        variant: "error",
      });
    }
  };

  const openBanDialog = (item: UserItem) => {
    setSelectedUser(item);
    setBanReason(item.banReason ?? "");
    setBanDialogOpen(true);
  };

  const onConfirmBan = async () => {
    if (!selectedUser) return;
    if (!banReason.trim()) {
      toast({
        title: "Thiếu lý do",
        description: "Vui lòng nhập lý do trước khi cấm user.",
        variant: "error",
      });
      return;
    }

    setBanSubmitting(true);
    try {
      await updateUser(selectedUser.id, { isBanned: true, banReason: banReason.trim() });
      toast({ title: "Đã cấm user", variant: "success" });
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason("");
      await load();
    } catch (banError) {
      setError(banError instanceof Error ? banError.message : "Failed to ban user");
      toast({
        title: "Không thể cấm user",
        description: banError instanceof Error ? banError.message : undefined,
        variant: "error",
      });
    } finally {
      setBanSubmitting(false);
    }
  };

  const onUnban = async (item: UserItem) => {
    if (!confirm(`Bỏ cấm user "${item.username}"?`)) {
      return;
    }
    try {
      await updateUser(item.id, { isBanned: false, banReason: "" });
      toast({ title: "Đã bỏ cấm user", variant: "success" });
      await load();
    } catch (unbanError) {
      setError(unbanError instanceof Error ? unbanError.message : "Failed to unban user");
      toast({
        title: "Không thể bỏ cấm user",
        description: unbanError instanceof Error ? unbanError.message : undefined,
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
            <span>System</span>
            <span>/</span>
            <span className="text-foreground font-medium">Users</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user accounts and their roles
          </p>
        </div>
        {canCreate && (
          <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Link href="/users/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create User
            </Link>
          </Button>
        )}
      </div>

      {/* Data Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading users...</span>
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
            <div className="divide-y divide-border/50">
              <div className="grid grid-cols-[1fr_140px_100px_120px] items-center gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30">
                <div>User</div>
                <div>Role</div>
                <div>Status</div>
                <div className="text-right">Action</div>
              </div>

              {rows.map((item) => (
                <div 
                  key={item.id} 
                  className="group grid grid-cols-[1fr_140px_100px_120px] items-center gap-3 px-6 py-4 text-sm hover:bg-muted/50 transition-colors"
                >

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0",
                      item.blocked 
                        ? "bg-destructive/10 text-destructive" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {item.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {item.username}
                        {item.blocked && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive">
                            Blocked
                          </span>
                        )}
                        {item.isBanned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                            Banned
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{item.email}</p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      {item.role?.name ?? "No role"}
                    </span>
                  </div>
                  <div>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                      item.confirmed 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      {item.confirmed ? "Active" : "Pending"}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                    {canUpdate && (
                      item.isBanned ? (
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                          onClick={() => onUnban(item)}
                          title="Unban user"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-600"
                          onClick={() => openBanDialog(item)}
                          title="Ban user"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )
                    )}
                    {canUpdate && (
                      <IconAction
                        label="Edit user"
                        icon={<Pencil className="h-4 w-4" />}
                        href={`/users/${item.id}/edit`}
                        variant="ghost"
                      />
                    )}
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
              {rows.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No users found</p>
                      <p className="text-xs text-muted-foreground mt-1">Create your first user to get started</p>
                    </div>
                    {canCreate && (
                      <Button asChild size="sm" className="mt-2">
                        <Link href="/users/new">
                          <Plus className="h-4 w-4 mr-1" />
                          Create User
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
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

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấm user</DialogTitle>
            <DialogDescription>
              Nhập lý do cấm cho user <strong>{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="ban-reason" className="text-sm font-medium text-foreground">
              Lý do
            </label>
            <textarea
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Nhập lý do cấm..."
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={banSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmBan}
              disabled={banSubmitting}
            >
              {banSubmitting ? "Đang xử lý..." : "Xác nhận cấm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
