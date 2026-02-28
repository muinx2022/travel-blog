"use client";

import { Pencil, Plus, Trash2, Eye, Shield } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconAction } from "@/components/icon-action";
import { PaginationControls } from "@/components/pagination-controls";
import { createRole, deleteRole, listRoles, type RoleItem } from "@/lib/admin-api";
import { can } from "@/lib/permissions";


export function RolesManager() {
  const canCreate = can("user", "create");
  const canUpdate = can("user", "update");
  const canDelete = can("user", "delete");

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const pageCount = Math.max(1, Math.ceil(roles.length / pageSize));
  const pagedRoles = useMemo(
    () => roles.slice((page - 1) * pageSize, page * pageSize),
    [roles, page],
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(await listRoles());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createRole({ name: newName.trim(), description: newDesc.trim() || undefined });
      toast({ title: "Role created", variant: "success" });
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      await load();
    } catch (err) {
      toast({
        title: "Failed to create role",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (role: RoleItem) => {
    if (!confirm(`Delete role "${role.name}"? Users assigned to this role will lose access.`)) return;
    try {
      await deleteRole(role.id);
      toast({ title: "Role deleted", variant: "success" });
      await load();
    } catch (err) {
      toast({
        title: "Failed to delete role",
        description: err instanceof Error ? err.message : undefined,
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
            <span className="text-foreground font-medium">Roles</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Roles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage roles and their permissions</p>
        </div>
        {canCreate && !showCreate && (
          <Button className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Role
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-6 space-y-4">

        {showCreate && (
          <div className="rounded-md border p-4 space-y-3">
            <p className="text-sm font-medium">New Role</p>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm"
              placeholder="Role name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <input
              className="w-full rounded border px-3 py-1.5 text-sm"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="divide-y">
          <div className="grid grid-cols-[1fr_120px] items-center gap-3 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30">
            <div>Role</div>
            <div className="text-right">Action</div>
          </div>
          {pagedRoles.map((role) => (
            <div key={role.id} className="group grid grid-cols-[1fr_120px] items-center gap-3 px-3 py-4 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">{role.name}</p>
                <p className="text-xs text-muted-foreground">
                  {role.description ?? role.type ?? ""}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                  <IconAction 
                    label="View role" 
                    icon={<Eye className="h-4 w-4" />} 
                    href={`/roles/${role.id}/view`} 
                    variant="ghost"
                  />
                  {canUpdate && (
                    <IconAction
                      label="Edit permissions"
                      icon={<Pencil className="h-4 w-4" />}
                      href={`/roles/${role.id}`}
                      variant="ghost"
                    />
                  )}
                  {canDelete && role.type !== "admin" && role.type !== "public" && role.type !== "authenticated" && (
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      onClick={() => handleDelete(role)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
              </div>
            </div>
          ))}
          {roles.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">No roles found</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first role to get started</p>
              {canCreate && (
                <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Role
                </Button>
              )}
            </div>
          )}
        </div>
        <PaginationControls
          page={page}
          pageCount={pageCount}
          total={roles.length}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
    </div>
  );
}
